import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWalletTransactions } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';
import { refreshTokenDeployments } from '@/lib/token-deployments';

// CRON_SECRET env var must be set in Vercel dashboard for manual invocation.
// Vercel's scheduler uses the x-vercel-cron header automatically (no secret needed).

export const maxDuration = 300;

const BATCH_SIZE = 1;      // one user at a time — avoids 429s
const BATCH_DELAY_MS = 3000; // 3s between users
const SOL_MINT = 'So11111111111111111111111111111111111111112';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Parse swaps from raw Helius txns into per-token buckets ──

function parseSwaps(txns: Awaited<ReturnType<typeof getWalletTransactions>>['txns'], walletAddress: string) {
  const tokenMap = new Map<string, {
    buySol: number; sellSol: number; count: number;
    firstAt: number; lastAt: number;
  }>();

  for (const tx of txns) {
    if (tx.type !== 'SWAP') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const accountData = tx.accountData || [];

    const nonSolToken = tokenTransfers.find(t => t.mint !== SOL_MINT);
    if (!nonSolToken) continue;

    const tokenMint = nonSolToken.mint;
    const tokenReceived = nonSolToken.toUserAccount === walletAddress;
    const tokenSent = nonSolToken.fromUserAccount === walletAddress;
    if (!tokenReceived && !tokenSent) continue;

    const walletAccount = accountData.find(a => a.account === walletAddress);
    const netSol = (walletAccount?.nativeBalanceChange ?? 0) / 1e9;

    if (!tokenMap.has(tokenMint)) {
      tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, count: 0, firstAt: tx.timestamp, lastAt: tx.timestamp });
    }
    const entry = tokenMap.get(tokenMint)!;
    entry.firstAt = Math.min(entry.firstAt, tx.timestamp);
    entry.lastAt = Math.max(entry.lastAt, tx.timestamp);
    entry.count++;

    if (tokenReceived && netSol < -0.001) {
      entry.buySol += Math.abs(netSol);
    } else if (tokenSent && netSol > 0.001) {
      entry.sellSol += netSol;
    }
  }

  return tokenMap;
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

  const solPrice = await getSolPrice();

  const users = await prisma.user.findMany({
    include: { wallets: true },
  });

  let processed = 0;
  let errors = 0;
  let newTxns = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async user => {
      try {
        for (const wallet of user.wallets) {
          // ── Incremental fetch: only new txns since last run ──
          const { txns, newestSignature } = await getWalletTransactions(wallet.address, {
            since: wallet.lastSignature,
          });

          newTxns += txns.length;

          if (txns.length > 0) {
            const swapMap = parseSwaps(txns, wallet.address);

            // Upsert WalletTrade records (accumulate over time)
            for (const [tokenMint, data] of swapMap) {
              await prisma.walletTrade.upsert({
                where: { walletId_tokenMint: { walletId: wallet.id, tokenMint } },
                create: {
                  walletId: wallet.id,
                  tokenMint,
                  tokenSymbol: tokenMint.slice(0, 6),
                  buySol: data.buySol,
                  sellSol: data.sellSol,
                  pnlSol: data.sellSol - data.buySol,
                  tradeCount: data.count,
                  firstTradeAt: new Date(data.firstAt * 1000),
                  lastTradeAt: new Date(data.lastAt * 1000),
                },
                update: {
                  buySol: { increment: data.buySol },
                  sellSol: { increment: data.sellSol },
                  pnlSol: { increment: data.sellSol - data.buySol },
                  tradeCount: { increment: data.count },
                  lastTradeAt: new Date(data.lastAt * 1000),
                  updatedAt: new Date(),
                },
              });
            }

            // Update cursor so next run only fetches newer txns
            await prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                lastSignature: newestSignature,
                lastFetchedAt: new Date(),
              },
            });
          }
        }

        // ── Compute rankings from accumulated WalletTrade data ──
        const allTrades = await prisma.walletTrade.findMany({
          where: { wallet: { userId: user.id } },
        });

        const now = Date.now();
        const periods = [
          { key: '1d',  ms: 1  * 86400 * 1000 },
          { key: '3d',  ms: 3  * 86400 * 1000 },
          { key: '7d',  ms: 7  * 86400 * 1000 },
          { key: '14d', ms: 14 * 86400 * 1000 },
        ] as const;

        for (const period of periods) {
          const cutoff = new Date(now - period.ms);
          const periodTrades = allTrades.filter(t => t.lastTradeAt >= cutoff);

          const pnlSol = periodTrades.reduce((s, t) => s + t.pnlSol, 0);
          const totalTrades = periodTrades.reduce((s, t) => s + t.tradeCount, 0);
          const wins = periodTrades.filter(t => t.pnlSol > 0).length;
          const winRate = periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0;

          await prisma.userRanking.upsert({
            where: { userId_period: { userId: user.id, period: period.key } },
            create: { userId: user.id, period: period.key, pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades },
            update: { pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades, updatedAt: new Date() },
          });
        }

        // All-time: use all accumulated trades + seed data floor
        const allTimePnlSol = allTrades.reduce((s, t) => s + t.pnlSol, 0);
        const allTimeTrades = allTrades.reduce((s, t) => s + t.tradeCount, 0);
        const allTimeWins = allTrades.filter(t => t.pnlSol > 0).length;
        const allTimeWR = allTrades.length > 0 ? (allTimeWins / allTrades.length) * 100 : 0;

        // Use seed data as floor for all-time (covers history before we started tracking)
        const seedPnlUsd = user.wallets.reduce((s, w) => s + (w.totalPnlUsd ?? 0), 0);
        const seedTrades = user.wallets.reduce((s, w) => s + (w.totalTrades ?? 0), 0);
        const finalPnlSol = Math.max(allTimePnlSol, seedPnlUsd / solPrice);
        const finalTrades = Math.max(allTimeTrades, seedTrades);

        await prisma.userRanking.upsert({
          where: { userId_period: { userId: user.id, period: 'all' } },
          create: { userId: user.id, period: 'all', pnlSol: finalPnlSol, pnlUsd: finalPnlSol * solPrice, winRate: allTimeWR, trades: finalTrades },
          update: { pnlSol: finalPnlSol, pnlUsd: finalPnlSol * solPrice, winRate: allTimeWR, trades: finalTrades, updatedAt: new Date() },
        });

        // Refresh token deployments
        try {
          await refreshTokenDeployments(user.id, user.wallets.map(w => ({ address: w.address })));
        } catch { /* non-fatal */ }

        processed++;
      } catch (err) {
        console.error(`[cron] Error processing user ${user.id}:`, err);
        errors++;
      }
    }));

    if (i + BATCH_SIZE < users.length) await sleep(BATCH_DELAY_MS);
  }

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    newTxns,
    totalUsers: users.length,
    solPrice,
    timestamp: new Date().toISOString(),
  });
}
