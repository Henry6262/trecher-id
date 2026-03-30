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
  topTrades: [] as { tokenSymbol: string; tokenImageUrl: string | null; pnlPercent: string; buy: string | null; sell: string | null }[],
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
      pinnedTrades: { where: { totalPnlPercent: { gt: 0 } }, orderBy: { totalPnlPercent: 'desc' }, take: 3 },
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

    const topTrades = u.pinnedTrades.map(t => {
      const txns = t.transactions as { type: string; amountSol: number }[] | undefined;
      return {
        tokenSymbol: t.tokenSymbol,
        tokenImageUrl: t.tokenImageUrl,
        pnlPercent: `+${t.totalPnlPercent.toFixed(0)}%`,
        buy: txns?.find(tx => tx.type === 'BUY')?.amountSol.toFixed(1) ?? null,
        sell: txns?.find(tx => tx.type === 'SELL')?.amountSol.toFixed(1) ?? null,
      };
    });

    return {
      username: u.username,
      name: u.displayName,
      avatarUrl: u.avatarUrl,
      pnl: formatPnl(totalPnlUsd),
      winRate: `${winRate.toFixed(0)}%`,
      trades: String(totalTrades),
      topTrades,
      // Keep single best for hero card
      recentToken: topTrades[0]?.tokenSymbol ?? null,
      recentTokenImage: topTrades[0]?.tokenImageUrl ?? null,
      recentPnl: topTrades[0]?.pnlPercent ?? null,
      recentBuy: topTrades[0]?.buy ?? null,
      recentSell: topTrades[0]?.sell ?? null,
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
