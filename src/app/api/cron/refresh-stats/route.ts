import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenMetadata, getWalletTransactions } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';
import { refreshTokenDeployments } from '@/lib/token-deployments';
import { fetchFxTwitterProfile } from '@/lib/fxtwitter';
import { invalidatePublicProfileCache } from '@/lib/profile';

// CRON_SECRET env var must be set in Vercel dashboard for manual invocation.
// Vercel's scheduler uses the x-vercel-cron header automatically (no secret needed).

export const maxDuration = 300;

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const WALLET_CONCURRENCY = Math.max(1, Number(process.env.CRON_WALLET_CONCURRENCY ?? 2));
const USER_CONCURRENCY = Math.max(1, Number(process.env.CRON_USER_CONCURRENCY ?? 4));
const ENRICHMENT_STALE_MS = 24 * 60 * 60 * 1000;

type TxnResult = Awaited<ReturnType<typeof getWalletTransactions>>;
type WalletJob = {
  id: string;
  address: string;
  lastSignature: string | null;
  lastFetchedAt: Date | null;
  userId: string;
  username: string;
  followerCount: number | null;
  userUpdatedAt: Date;
};

type WalletSyncResult = {
  walletId: string;
  userId: string;
  username: string;
  txnsFetched: number;
  swapsUpserted: number;
  hadNewTransactions: boolean;
};

type UserRefreshResult = {
  userId: string;
  username: string;
  wallets: number;
  rankingsUpdated: number;
  ancillaryRefreshed: boolean;
};

type WalletResult =
  | { ok: true; value: WalletSyncResult }
  | { ok: false; walletId: string; address: string; userId: string; username: string; error: string };

type UserResult =
  | { ok: true; value: UserRefreshResult }
  | { ok: false; userId: string; username: string; error: string };

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
}

async function notifySlack(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Parse swaps from raw Helius txns into per-token buckets ──

function parseSwaps(txns: TxnResult['txns'], walletAddress: string) {
  const tokenMap = new Map<string, {
    buySol: number; sellSol: number; count: number;
    firstAt: number; lastAt: number;
  }>();

  for (const tx of txns) {
    if (tx.type !== 'SWAP' && tx.type !== 'TRANSFER' && tx.type !== 'UNKNOWN') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    const accountData = tx.accountData || [];

    const nonSolTokens = tokenTransfers.filter(t => t.mint !== SOL_MINT);
    if (nonSolTokens.length === 0) continue;

    // For non-SWAP types, require both token AND SOL movement
    if (tx.type !== 'SWAP') {
      const hasNativeFlow = nativeTransfers.some(n => n.fromUserAccount === walletAddress || n.toUserAccount === walletAddress);
      if (!hasNativeFlow) continue;
    }

    // Use nativeTransfers (excludes gas) instead of nativeBalanceChange (includes gas)
    let solSpent = 0;
    let solReceived = 0;
    for (const nt of nativeTransfers) {
      const amountSol = nt.amount / 1e9;
      if (nt.fromUserAccount === walletAddress) solSpent += amountSol;
      if (nt.toUserAccount === walletAddress) solReceived += amountSol;
    }
    const netSol = solReceived - solSpent;
    const effectiveNetSol = (solSpent === 0 && solReceived === 0)
      ? (accountData.find(a => a.account === walletAddress)?.nativeBalanceChange ?? 0) / 1e9
      : netSol;

    for (const token of nonSolTokens) {
      const tokenMint = token.mint;
      const tokenReceived = token.toUserAccount === walletAddress;
      const tokenSent = token.fromUserAccount === walletAddress;
      if (!tokenReceived && !tokenSent) continue;

      if (!tokenMap.has(tokenMint)) {
        tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, count: 0, firstAt: tx.timestamp, lastAt: tx.timestamp });
      }
      const entry = tokenMap.get(tokenMint)!;
      entry.firstAt = Math.min(entry.firstAt, tx.timestamp);
      entry.lastAt = Math.max(entry.lastAt, tx.timestamp);
      entry.count++;

      if (tokenReceived && effectiveNetSol < -0.0001) {
        entry.buySol += Math.abs(effectiveNetSol);
      } else if (tokenSent && effectiveNetSol > 0.0001) {
        entry.sellSol += effectiveNetSol;
      }

      break;
    }
  }

  return tokenMap;
}

async function syncWallet(wallet: WalletJob): Promise<WalletSyncResult> {
  const { txns, newestSignature } = await getWalletTransactions(wallet.address, {
    since: wallet.lastSignature,
  });

  let swapsUpserted = 0;

  if (txns.length > 0) {
    const swapMap = parseSwaps(txns, wallet.address);
    const tokenMetadata = await getTokenMetadata(Array.from(swapMap.keys()));
    swapsUpserted = swapMap.size;

    for (const [tokenMint, data] of swapMap) {
      const meta = tokenMetadata.get(tokenMint);
      await prisma.walletTrade.upsert({
        where: { walletId_tokenMint: { walletId: wallet.id, tokenMint } },
        create: {
          walletId: wallet.id,
          tokenMint,
          tokenSymbol: meta?.symbol || tokenMint.slice(0, 6),
          tokenName: meta?.name || null,
          tokenImageUrl: meta?.image || null,
          buySol: data.buySol,
          sellSol: data.sellSol,
          pnlSol: data.sellSol - data.buySol,
          tradeCount: data.count,
          firstTradeAt: new Date(data.firstAt * 1000),
          lastTradeAt: new Date(data.lastAt * 1000),
        },
        update: {
          tokenSymbol: meta?.symbol || tokenMint.slice(0, 6),
          tokenName: meta?.name || null,
          tokenImageUrl: meta?.image || null,
          buySol: { increment: data.buySol },
          sellSol: { increment: data.sellSol },
          pnlSol: { increment: data.sellSol - data.buySol },
          tradeCount: { increment: data.count },
          lastTradeAt: new Date(data.lastAt * 1000),
          updatedAt: new Date(),
        },
      });
    }
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      lastSignature: txns.length > 0 ? newestSignature : wallet.lastSignature,
      lastFetchedAt: new Date(),
    },
  });

  return {
    walletId: wallet.id,
    userId: wallet.userId,
    username: wallet.username,
    txnsFetched: txns.length,
    swapsUpserted,
    hadNewTransactions: txns.length > 0,
  };
}

async function refreshUserRankings(
  user: Pick<WalletJob, 'userId' | 'username' | 'followerCount' | 'userUpdatedAt'>,
  solPrice: number,
  shouldRefreshAncillary: boolean,
): Promise<UserRefreshResult> {
  const wallets = await prisma.wallet.findMany({
    where: { userId: user.userId },
    select: { id: true, address: true },
  });

  const walletIds = wallets.map((wallet) => wallet.id);
  const allTrades = walletIds.length > 0
    ? await prisma.walletTrade.findMany({
        where: { walletId: { in: walletIds } },
      })
    : [];

  const tradesByWallet = new Map<string, typeof allTrades>();
  for (const trade of allTrades) {
    const bucket = tradesByWallet.get(trade.walletId) ?? [];
    bucket.push(trade);
    tradesByWallet.set(trade.walletId, bucket);
  }

  for (const wallet of wallets) {
    const walletTrades = tradesByWallet.get(wallet.id) ?? [];
    const totalTrades = walletTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
    const wins = walletTrades.reduce((sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0), 0);
    const totalPnlSol = walletTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        totalPnlUsd: totalPnlSol * solPrice,
        winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
        totalTrades,
        statsUpdatedAt: new Date(),
      },
    });
  }

  const now = Date.now();
  const periods = [
    { key: '1d', ms: 1 * 86400 * 1000 },
    { key: '3d', ms: 3 * 86400 * 1000 },
    { key: '7d', ms: 7 * 86400 * 1000 },
    { key: '14d', ms: 14 * 86400 * 1000 },
  ] as const;

  for (const period of periods) {
    const cutoff = new Date(now - period.ms);
    const periodTrades = allTrades.filter((trade) => trade.lastTradeAt >= cutoff);

    const pnlSol = periodTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
    const totalTrades = periodTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
    const wins = periodTrades.reduce((sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0), 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    await prisma.userRanking.upsert({
      where: { userId_period: { userId: user.userId, period: period.key } },
      create: { userId: user.userId, period: period.key, pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades },
      update: { pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades, updatedAt: new Date() },
    });
  }

  const allTimePnlSol = allTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
  const allTimeTrades = allTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
  const allTimeWins = allTrades.reduce((sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0), 0);
  const allTimeWR = allTimeTrades > 0 ? (allTimeWins / allTimeTrades) * 100 : 0;

  await prisma.userRanking.upsert({
    where: { userId_period: { userId: user.userId, period: 'all' } },
    create: { userId: user.userId, period: 'all', pnlSol: allTimePnlSol, pnlUsd: allTimePnlSol * solPrice, winRate: allTimeWR, trades: allTimeTrades },
    update: { pnlSol: allTimePnlSol, pnlUsd: allTimePnlSol * solPrice, winRate: allTimeWR, trades: allTimeTrades, updatedAt: new Date() },
  });

  let ancillaryRefreshed = false;

  if (shouldRefreshAncillary) {
    ancillaryRefreshed = true;

    try {
      await refreshTokenDeployments(user.userId, wallets.map((wallet) => ({ address: wallet.address })));
    } catch {
      // Non-fatal
    }

    if (user.username && !user.username.includes(' ')) {
      try {
        const profile = await fetchFxTwitterProfile(user.username);
        if (profile.followerCount != null) {
          await prisma.user.update({
            where: { id: user.userId },
            data: { followerCount: profile.followerCount },
          });
        }
      } catch {
        // Non-fatal
      }
    }
  }

  await invalidatePublicProfileCache(user.username);

  return {
    userId: user.userId,
    username: user.username,
    wallets: wallets.length,
    rankingsUpdated: periods.length + 1,
    ancillaryRefreshed,
  };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const vercelCron = req.headers.get('x-vercel-cron');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = vercelCron === '1' && process.env.NODE_ENV === 'production';
  const isManualAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isManualAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get('limit') ?? '');
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : null;
  const skipSlack = url.searchParams.get('skipSlack') === '1';
  const skipAncillary = url.searchParams.get('skipAncillary') === '1';

  try {
    const solPrice = await getSolPrice();
    const wallets = await prisma.wallet.findMany({
      where: { address: { not: '' } },
      orderBy: [
        { lastFetchedAt: 'asc' },
        { linkedAt: 'asc' },
      ],
      select: {
        id: true,
        address: true,
        lastSignature: true,
        lastFetchedAt: true,
        userId: true,
        user: {
          select: {
            username: true,
            followerCount: true,
            updatedAt: true,
          },
        },
      },
      take: limit ?? undefined,
    });

    const walletJobs: WalletJob[] = wallets.map((wallet) => ({
      id: wallet.id,
      address: wallet.address,
      lastSignature: wallet.lastSignature,
      lastFetchedAt: wallet.lastFetchedAt,
      userId: wallet.userId,
      username: wallet.user.username,
      followerCount: wallet.user.followerCount,
      userUpdatedAt: wallet.user.updatedAt,
    }));

    const uniqueUsers = new Map<string, Pick<WalletJob, 'userId' | 'username' | 'followerCount' | 'userUpdatedAt'>>();
    for (const wallet of walletJobs) {
      uniqueUsers.set(wallet.userId, {
        userId: wallet.userId,
        username: wallet.username,
        followerCount: wallet.followerCount,
        userUpdatedAt: wallet.userUpdatedAt,
      });
    }

    const staleHoursBefore = walletJobs
      .map((wallet) => wallet.lastFetchedAt ? (Date.now() - wallet.lastFetchedAt.getTime()) / 36e5 : null)
      .filter((value): value is number => value != null);

    const walletResults = await runWithConcurrency<WalletJob, WalletResult>(walletJobs, WALLET_CONCURRENCY, async (wallet) => {
      try {
        return { ok: true, value: await syncWallet(wallet) };
      } catch (err) {
        console.error(`[cron] Error processing wallet ${wallet.address}:`, err);
        return {
          ok: false,
          walletId: wallet.id,
          address: wallet.address,
          userId: wallet.userId,
          username: wallet.username,
          error: err instanceof Error ? err.message : 'Unknown wallet sync error',
        };
      }
    });

    const successfulWallets = walletResults
      .filter((result): result is Extract<WalletResult, { ok: true }> => result.ok)
      .map((result) => result.value);
    const walletErrors = walletResults.filter((result): result is Extract<WalletResult, { ok: false }> => !result.ok);

    const usersWithNewTransactions = new Set(
      successfulWallets.filter((result) => result.hadNewTransactions).map((result) => result.userId),
    );

    const userResults = await runWithConcurrency<Pick<WalletJob, 'userId' | 'username' | 'followerCount' | 'userUpdatedAt'>, UserResult>(
      Array.from(uniqueUsers.values()),
      USER_CONCURRENCY,
      async (user) => {
        try {
          const enrichmentIsStale = Date.now() - user.userUpdatedAt.getTime() >= ENRICHMENT_STALE_MS;
          const shouldRefreshAncillary = !skipAncillary
            && (usersWithNewTransactions.has(user.userId) || user.followerCount == null || enrichmentIsStale);

          return {
            ok: true,
            value: await refreshUserRankings(user, solPrice, shouldRefreshAncillary),
          };
        } catch (err) {
          console.error(`[cron] Error refreshing rankings for ${user.username}:`, err);
          return {
            ok: false,
            userId: user.userId,
            username: user.username,
            error: err instanceof Error ? err.message : 'Unknown ranking refresh error',
          };
        }
      },
    );

    const successfulUsers = userResults
      .filter((result): result is Extract<UserResult, { ok: true }> => result.ok)
      .map((result) => result.value);
    const userErrors = userResults.filter((result): result is Extract<UserResult, { ok: false }> => !result.ok);

    const summary = {
      ok: walletErrors.length === 0 && userErrors.length === 0,
      walletsProcessed: successfulWallets.length,
      walletsFailed: walletErrors.length,
      usersProcessed: successfulUsers.length,
      usersFailed: userErrors.length,
      newTxns: successfulWallets.reduce((sum, result) => sum + result.txnsFetched, 0),
      swapsUpserted: successfulWallets.reduce((sum, result) => sum + result.swapsUpserted, 0),
      ancillaryRefreshed: successfulUsers.filter((result) => result.ancillaryRefreshed).length,
      totalWalletsTargeted: walletJobs.length,
      solPrice,
      walletConcurrency: WALLET_CONCURRENCY,
      userConcurrency: USER_CONCURRENCY,
      oldestWalletAgeHoursBefore: staleHoursBefore.length > 0 ? Number(Math.max(...staleHoursBefore).toFixed(2)) : null,
      walletErrorSample: walletErrors.slice(0, 5),
      userErrorSample: userErrors.slice(0, 5),
      timestamp: new Date().toISOString(),
    };

    if (!skipSlack) {
      await notifySlack(
        [
          `web3me refresh-stats: ${summary.ok ? 'ok' : 'partial'}`,
          `wallets ${summary.walletsProcessed}/${summary.totalWalletsTargeted}`,
          `wallet-errors ${summary.walletsFailed}`,
          `users ${summary.usersProcessed}`,
          `user-errors ${summary.usersFailed}`,
          `txns ${summary.newTxns}`,
          `swaps ${summary.swapsUpserted}`,
          `ancillary ${summary.ancillaryRefreshed}`,
          `oldest-before ${summary.oldestWalletAgeHoursBefore ?? 'n/a'}h`,
        ].join(' | '),
      );
    }

    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (!skipSlack) {
      await notifySlack(`web3me refresh-stats: failed | ${message}`);
    }

    console.error('[cron] refresh-stats failed:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
