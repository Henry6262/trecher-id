import { prisma } from '@/lib/prisma';
import { cached } from '@/lib/redis';
import { LandingContent } from '@/components/landing-content';
import { formatPnl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const FALLBACK_FEATURED = {
  username: 'trenchid',
  name: 'Trench ID',
  avatarUrl: null,
  pnl: '$0',
  winRate: '0%',
  trades: '0',
  recentToken: null,
  recentTokenImage: null,
  recentPnl: null,
  recentBuy: null,
  recentSell: null,
};

async function fetchLandingData() {
  const users = await prisma.user.findMany({
    include: {
      wallets: true,
      pinnedTrades: { orderBy: { totalPnlSol: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
    take: 15,
  });

  const traders = users.map(u => {
    let totalPnlUsd = 0;
    let totalWinRate = 0;
    let winRateCount = 0;
    let totalTrades = 0;
    for (const w of u.wallets) {
      totalPnlUsd += w.totalPnlUsd ?? 0;
      totalTrades += w.totalTrades ?? 0;
      if (w.winRate != null) { totalWinRate += w.winRate; winRateCount++; }
    }
    const winRate = winRateCount > 0 ? totalWinRate / winRateCount : 0;

    const bestTrade = u.pinnedTrades[0];
    const txns = bestTrade?.transactions as { type: string; amountSol: number }[] | undefined;

    return {
      username: u.username,
      name: u.displayName,
      avatarUrl: u.avatarUrl,
      pnl: formatPnl(totalPnlUsd),
      winRate: `${winRate.toFixed(0)}%`,
      trades: String(totalTrades),
      recentToken: bestTrade?.tokenSymbol ?? null,
      recentTokenImage: bestTrade?.tokenImageUrl ?? null,
      recentPnl: bestTrade ? `${bestTrade.totalPnlPercent >= 0 ? '+' : ''}${bestTrade.totalPnlPercent.toFixed(0)}%` : null,
      recentBuy: txns?.find(t => t.type === 'BUY')?.amountSol.toFixed(1) ?? null,
      recentSell: txns?.find(t => t.type === 'SELL')?.amountSol.toFixed(1) ?? null,
    };
  });

  const totalTraderCount = await prisma.user.count();
  let aggregatePnl = 0;
  for (const t of traders) {
    const raw = t.pnl.replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      if (t.pnl.includes('K')) aggregatePnl += num * 1000;
      else if (t.pnl.includes('M')) aggregatePnl += num * 1000000;
      else aggregatePnl += num;
    }
  }
  const totalPnlStr = aggregatePnl >= 1000000
    ? `$${(aggregatePnl / 1000000).toFixed(1)}M`
    : `$${(aggregatePnl / 1000).toFixed(0)}K`;

  return { traders, totalTraderCount, totalPnlStr };
}

export default async function LandingPage() {
  try {
    // Cache landing data for 5 minutes in Redis
    const { traders, totalTraderCount, totalPnlStr } = await cached(
      'landing:traders',
      300,
      fetchLandingData,
    );

    const featured = traders[0] ?? FALLBACK_FEATURED;
    return <LandingContent traders={traders} featured={featured} traderCount={totalTraderCount} totalPnl={totalPnlStr} />;
  } catch (error) {
    console.error('Landing page error:', error);
    return <LandingContent traders={[]} featured={FALLBACK_FEATURED} traderCount={0} totalPnl="$0" />;
  }
}
