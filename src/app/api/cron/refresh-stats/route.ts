import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenMetadata, getWalletTransactions } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';
import { refreshTokenDeployments } from '@/lib/token-deployments';
import { fetchFxTwitterProfile } from '@/lib/fxtwitter';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { parseWalletTrades } from '@/lib/wallet-trade-parser';
import {
  assessWalletSync,
  getWalletSyncHealthReport,
  recordWalletSyncFailure,
  recordWalletSyncSuccess,
  shouldAutoRemediateWalletSync,
} from '@/lib/wallet-sync-health';
import { rebuildWalletTradeData } from '@/lib/wallet-trade-rebuild';
import {
  LEADERBOARD_PERIODS,
  materializeLeaderboardRanks,
  validateLeaderboardRerankReadiness,
} from '@/lib/leaderboard-ranks';

// CRON_SECRET env var must be set in Vercel dashboard for manual invocation.
// Vercel's scheduler uses the x-vercel-cron header automatically (no secret needed).

export const maxDuration = 300;

const WALLET_CONCURRENCY = Math.max(1, Number(process.env.CRON_WALLET_CONCURRENCY ?? 2));
const USER_CONCURRENCY = Math.max(1, Number(process.env.CRON_USER_CONCURRENCY ?? 4));
const REMEDIATION_CONCURRENCY = Math.max(1, Number(process.env.CRON_REMEDIATION_CONCURRENCY ?? 1));
const REMEDIATION_MAX_PAGES = Math.max(5, Number(process.env.CRON_REMEDIATION_MAX_PAGES ?? 20));
const ENRICHMENT_STALE_MS = 24 * 60 * 60 * 1000;

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
  address: string;
  userId: string;
  username: string;
  txnsFetched: number;
  swapsUpserted: number;
  eventRowsUpserted: number;
  hadNewTransactions: boolean;
  warningCode: string | null;
  continuityStatus: string | null;
  continuityIssue: string | null;
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

type WalletRemediationResult =
  | {
      ok: true;
      walletId: string;
      address: string;
      userId: string;
      username: string;
      reason: string;
      fetchedTransactions: number;
      eventRows: number;
    }
  | {
      ok: false;
      walletId: string;
      address: string;
      userId: string;
      username: string;
      reason: string;
      error: string;
    };

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

async function syncWallet(wallet: WalletJob): Promise<WalletSyncResult> {
  const attemptedAt = new Date();
  const {
    txns,
    newestSignature,
    oldestFetchedSignature,
    pagesFetched,
    previousCursorFound,
    reachedHistoryEnd,
    pageLimitReached,
  } = await getWalletTransactions(wallet.address, {
    since: wallet.lastSignature,
  });

  let swapsUpserted = 0;
  let eventRowsUpserted = 0;
  let candidateTxCount = 0;
  let oldestExactEventAt: Date | null = null;

  if (txns.length > 0) {
    const parsed = parseWalletTrades(txns, wallet.address);
    const tokenMetadata = await getTokenMetadata(Array.from(parsed.aggregates.keys()));
    swapsUpserted = parsed.aggregates.size;
    eventRowsUpserted = parsed.events.length;
    candidateTxCount = parsed.candidateTxCount;
    oldestExactEventAt =
      parsed.events.length > 0
        ? parsed.events.reduce(
            (oldest, event) => {
              const eventAt = new Date(event.timestamp * 1000);
              return oldest == null || eventAt < oldest ? eventAt : oldest;
            },
            null as Date | null,
          )
        : null;

    for (const [tokenMint, data] of parsed.aggregates) {
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

    for (const event of parsed.events) {
      const meta = tokenMetadata.get(event.tokenMint);
      await prisma.walletTradeEvent.upsert({
        where: {
          walletId_signature_tokenMint_type: {
            walletId: wallet.id,
            signature: event.signature,
            tokenMint: event.tokenMint,
            type: event.type,
          },
        },
        create: {
          walletId: wallet.id,
          signature: event.signature,
          tokenMint: event.tokenMint,
          tokenSymbol: meta?.symbol || event.tokenMint.slice(0, 6),
          tokenName: meta?.name || null,
          tokenImageUrl: meta?.image || null,
          type: event.type,
          amountSol: event.amountSol,
          timestamp: new Date(event.timestamp * 1000),
        },
        update: {
          tokenSymbol: meta?.symbol || event.tokenMint.slice(0, 6),
          tokenName: meta?.name || null,
          tokenImageUrl: meta?.image || null,
          amountSol: event.amountSol,
          timestamp: new Date(event.timestamp * 1000),
        },
      });
    }
  }

  const assessment = assessWalletSync({
    syncMode: 'incremental',
    previousSignature: wallet.lastSignature,
    previousCursorFound,
    pageLimitReached,
    txnsFetched: txns.length,
    candidateTxCount,
    tradeRows: swapsUpserted,
    eventRows: eventRowsUpserted,
  });

  await recordWalletSyncSuccess({
    walletId: wallet.id,
    syncMode: 'incremental',
    attemptedAt,
    successfulAt: new Date(),
    newestSignature,
    oldestFetchedSignature,
    previousSignature: wallet.lastSignature,
    txnsFetched: txns.length,
    candidateTxCount,
    tradeRows: swapsUpserted,
    eventRows: eventRowsUpserted,
    pagesFetched,
    previousCursorFound,
    reachedHistoryEnd,
    pageLimitReached,
    oldestExactEventAt,
  });

  return {
    walletId: wallet.id,
    address: wallet.address,
    userId: wallet.userId,
    username: wallet.username,
    txnsFetched: txns.length,
    swapsUpserted,
    eventRowsUpserted,
    hadNewTransactions: txns.length > 0,
    warningCode: assessment.warningCode,
    continuityStatus: assessment.continuityStatus,
    continuityIssue: assessment.continuityIssue,
  };
}

async function remediateWallet(
  wallet: WalletJob,
  solPrice: number,
  reason: string,
): Promise<WalletRemediationResult> {
  try {
    const rebuild = await rebuildWalletTradeData({
      walletId: wallet.id,
      walletAddress: wallet.address,
      userId: wallet.userId,
      solPrice,
      maxPages: REMEDIATION_MAX_PAGES,
    });

    await invalidatePublicProfileCache(wallet.username);

    return {
      ok: true,
      walletId: wallet.id,
      address: wallet.address,
      userId: wallet.userId,
      username: wallet.username,
      reason,
      fetchedTransactions: rebuild.fetchedTransactions,
      eventRows: rebuild.eventRows,
    };
  } catch (error) {
    return {
      ok: false,
      walletId: wallet.id,
      address: wallet.address,
      userId: wallet.userId,
      username: wallet.username,
      reason,
      error: error instanceof Error ? error.message : 'Unknown remediation error',
    };
  }
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

  const rankingRows: Array<{
    userId: string;
    period: string;
    pnlSol: number;
    pnlUsd: number;
    winRate: number;
    trades: number;
    updatedAt: Date;
  }> = [];

  for (const period of periods) {
    const cutoff = new Date(now - period.ms);
    const periodTrades = allTrades.filter((trade) => trade.lastTradeAt >= cutoff);

    const pnlSol = periodTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
    const totalTrades = periodTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
    const wins = periodTrades.reduce((sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0), 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    rankingRows.push({
      userId: user.userId,
      period: period.key,
      pnlSol,
      pnlUsd: pnlSol * solPrice,
      winRate,
      trades: totalTrades,
      updatedAt: new Date(),
    });
  }

  const allTimePnlSol = allTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
  const allTimeTrades = allTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
  const allTimeWins = allTrades.reduce((sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0), 0);
  const allTimeWR = allTimeTrades > 0 ? (allTimeWins / allTimeTrades) * 100 : 0;

  rankingRows.push({
    userId: user.userId,
    period: 'all',
    pnlSol: allTimePnlSol,
    pnlUsd: allTimePnlSol * solPrice,
    winRate: allTimeWR,
    trades: allTimeTrades,
    updatedAt: new Date(),
  });

  await prisma.userRanking.deleteMany({
    where: {
      userId: user.userId,
      period: { in: rankingRows.map((row) => row.period) },
    },
  });

  await prisma.userRanking.createMany({
    data: rankingRows,
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
        await recordWalletSyncFailure({
          walletId: wallet.id,
          syncMode: 'incremental',
          error: err instanceof Error ? err.message : 'Unknown wallet sync error',
          previousSignature: wallet.lastSignature,
        });
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

    const remediationJobs = successfulWallets
      .filter((result) =>
        shouldAutoRemediateWalletSync({
          continuityStatus: result.continuityStatus,
          warningCode: result.warningCode,
        }),
      )
      .map((result) => {
        const wallet = walletJobs.find((job) => job.id === result.walletId);
        if (!wallet) return null;

        const reasons = [
          result.warningCode ? `warning:${result.warningCode}` : null,
          result.continuityStatus && result.continuityStatus !== 'ok' && result.continuityStatus !== 'bootstrap'
            ? `continuity:${result.continuityStatus}`
            : null,
        ].filter(Boolean).join(',');

        return { wallet, reason: reasons || 'auto-remediation' };
      })
      .filter((value): value is { wallet: WalletJob; reason: string } => value != null);

    const remediationResults = await runWithConcurrency<
      { wallet: WalletJob; reason: string },
      WalletRemediationResult
    >(
      remediationJobs,
      REMEDIATION_CONCURRENCY,
      async ({ wallet, reason }) => remediateWallet(wallet, solPrice, reason),
    );

    const remediationSuccesses = remediationResults.filter(
      (result): result is Extract<WalletRemediationResult, { ok: true }> => result.ok,
    );
    const remediationFailures = remediationResults.filter(
      (result): result is Extract<WalletRemediationResult, { ok: false }> => !result.ok,
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
      ok: walletErrors.length === 0 && userErrors.length === 0 && remediationFailures.length === 0,
      walletsProcessed: successfulWallets.length,
      walletsFailed: walletErrors.length,
      remediationsTriggered: remediationJobs.length,
      remediationsSucceeded: remediationSuccesses.length,
      remediationsFailed: remediationFailures.length,
      usersProcessed: successfulUsers.length,
      usersFailed: userErrors.length,
      newTxns: successfulWallets.reduce((sum, result) => sum + result.txnsFetched, 0),
      swapsUpserted: successfulWallets.reduce((sum, result) => sum + result.swapsUpserted, 0),
      eventRowsUpserted: successfulWallets.reduce((sum, result) => sum + result.eventRowsUpserted, 0),
      ancillaryRefreshed: successfulUsers.filter((result) => result.ancillaryRefreshed).length,
      totalWalletsTargeted: walletJobs.length,
      solPrice,
      walletConcurrency: WALLET_CONCURRENCY,
      userConcurrency: USER_CONCURRENCY,
      oldestWalletAgeHoursBefore: staleHoursBefore.length > 0 ? Number(Math.max(...staleHoursBefore).toFixed(2)) : null,
      walletErrorSample: walletErrors.slice(0, 5),
      remediationSample: remediationFailures.slice(0, 5),
      userErrorSample: userErrors.slice(0, 5),
      timestamp: new Date().toISOString(),
    };
    const syncHealth = await getWalletSyncHealthReport(5);
    const rerankValidation = validateLeaderboardRerankReadiness({
      fullRun: limit == null,
      totalWalletsTargeted: walletJobs.length,
      walletErrors: walletErrors.length,
      userErrors: userErrors.length,
      remediationFailures: remediationFailures.length,
      syncHealth,
    });
    const rerankSummary = rerankValidation.ok
      ? {
          attempted: true,
          completed: true,
          blocked: false,
          reasons: [] as string[],
          periods: await materializeLeaderboardRanks(LEADERBOARD_PERIODS),
        }
      : {
          attempted: false,
          completed: false,
          blocked: true,
          reasons: rerankValidation.reasons,
          periods: [] as Array<{ period: string; ranked: number }>,
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
          `events ${summary.eventRowsUpserted}`,
          `remediated ${summary.remediationsSucceeded}/${summary.remediationsTriggered}`,
          `ancillary ${summary.ancillaryRefreshed}`,
          `rerank ${rerankSummary.completed ? 'done' : 'blocked'}`,
          `oldest-before ${summary.oldestWalletAgeHoursBefore ?? 'n/a'}h`,
          `stale-critical ${syncHealth.totals.staleCritical}`,
          `continuity-risk ${syncHealth.totals.walletsWithContinuityRisk}`,
          `event-gaps ${syncHealth.totals.walletsMissingEventCoverage}`,
          `history-gaps ${syncHealth.totals.walletsWithHistoryCoverageGap}`,
        ].join(' | '),
      );

      if (
        remediationFailures.length > 0 ||
        syncHealth.totals.walletsWithContinuityRisk > 0 ||
        syncHealth.totals.walletsMissingEventCoverage > 0 ||
        syncHealth.totals.walletsWithHistoryCoverageGap > 0
      ) {
        await notifySlack(
          [
            'web3me sync-risk details',
            remediationFailures.length > 0
              ? `remediation-failures ${remediationFailures.slice(0, 3).map((item) => `${item.username}:${item.reason}`).join(', ')}`
              : null,
            syncHealth.samples.continuityRisk.length > 0
              ? `continuity ${syncHealth.samples.continuityRisk.map((item) => `${item.username}:${item.lastContinuityStatus}`).join(', ')}`
              : null,
            syncHealth.samples.missingEventCoverage.length > 0
              ? `event-gaps ${syncHealth.samples.missingEventCoverage.map((item) => item.username).join(', ')}`
              : null,
            syncHealth.samples.historyCoverageGap.length > 0
              ? `history-gaps ${syncHealth.samples.historyCoverageGap.map((item) => item.username).join(', ')}`
              : null,
            rerankSummary.blocked
              ? `rerank-blocked ${rerankSummary.reasons.join(', ')}`
              : null,
          ].filter(Boolean).join(' | '),
        );
      }
    }

    return NextResponse.json({
      ...summary,
      syncHealth,
      rerankValidation,
      rerankSummary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (!skipSlack) {
      await notifySlack(`web3me refresh-stats: failed | ${message}`);
    }

    console.error('[cron] refresh-stats failed:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
