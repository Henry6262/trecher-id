import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWalletTransactions, aggregateTradesByToken } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';

export const maxDuration = 300; // 5 min for cron

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const solPrice = await getSolPrice();

  // Fetch all users with wallets
  const users = await prisma.user.findMany({
    include: { wallets: true },
  });

  let processed = 0;
  let errors = 0;
  const periods = [
    { key: '1d', days: 1 },
    { key: '3d', days: 3 },
    { key: '7d', days: 7 },
  ] as const;

  // Process in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          // Aggregate across all wallets for each period
          const periodStats: Record<string, { pnlSol: number; wins: number; total: number }> = {
            '1d': { pnlSol: 0, wins: 0, total: 0 },
            '3d': { pnlSol: 0, wins: 0, total: 0 },
            '7d': { pnlSol: 0, wins: 0, total: 0 },
          };

          for (const wallet of user.wallets) {
            let txns;
            try {
              txns = await getWalletTransactions(wallet.address);
            } catch {
              continue; // skip wallet on API failure
            }

            for (const period of periods) {
              const trades = await aggregateTradesByToken(txns, wallet.address, period.days);
              for (const trade of trades) {
                periodStats[period.key].pnlSol += trade.totalPnlSol;
                periodStats[period.key].total += trade.transactions.length;
                if (trade.totalPnlSol > 0) periodStats[period.key].wins++;
              }
            }
          }

          // Upsert rankings for timed periods
          for (const period of periods) {
            const stats = periodStats[period.key];
            const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
            const pnlUsd = stats.pnlSol * solPrice;

            await prisma.userRanking.upsert({
              where: { userId_period: { userId: user.id, period: period.key } },
              create: {
                userId: user.id,
                period: period.key,
                pnlSol: stats.pnlSol,
                pnlUsd,
                winRate,
                trades: stats.total,
              },
              update: {
                pnlSol: stats.pnlSol,
                pnlUsd,
                winRate,
                trades: stats.total,
                updatedAt: new Date(),
              },
            });
          }

          // "all" period from wallet aggregate stats
          let allPnlUsd = 0;
          let allWinRateSum = 0;
          let allWinRateCount = 0;
          let allTrades = 0;
          let allPnlSol = 0;

          for (const wallet of user.wallets) {
            allPnlUsd += wallet.totalPnlUsd ?? 0;
            allTrades += wallet.totalTrades ?? 0;
            if (wallet.winRate != null) {
              allWinRateSum += wallet.winRate;
              allWinRateCount++;
            }
          }

          // Estimate all-time SOL from USD (or use 7d SOL as proxy)
          allPnlSol = allPnlUsd / solPrice;
          const allWinRate = allWinRateCount > 0 ? allWinRateSum / allWinRateCount : 0;

          await prisma.userRanking.upsert({
            where: { userId_period: { userId: user.id, period: 'all' } },
            create: {
              userId: user.id,
              period: 'all',
              pnlSol: allPnlSol,
              pnlUsd: allPnlUsd,
              winRate: allWinRate,
              trades: allTrades,
            },
            update: {
              pnlSol: allPnlSol,
              pnlUsd: allPnlUsd,
              winRate: allWinRate,
              trades: allTrades,
              updatedAt: new Date(),
            },
          });

          processed++;
        } catch (err) {
          console.error(`[refresh-stats] Error processing user ${user.id}:`, err);
          errors++;
        }
      }),
    );

    // Delay between batches to respect Helius rate limits
    if (i + BATCH_SIZE < users.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    totalUsers: users.length,
    solPrice,
    timestamp: new Date().toISOString(),
  });
}
