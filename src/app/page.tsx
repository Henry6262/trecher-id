import { prisma } from '@/lib/prisma';
import { LandingContent } from '@/components/landing-content';
import { formatPnl } from '@/lib/utils';
import { cached } from '@/lib/redis';
import type { TickerItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  let traders: { username: string; name: string; avatarUrl: string | null; pnl: string; winRate: string; trades: string; recentToken: string | null; recentTokenImage: string | null; recentPnl: string | null; recentBuy: string | null; recentSell: string | null }[] = [];
  let ticker: TickerItem[] = [];

  try {
  // Fetch top traders with their best pinned trade from DB
  const users = await prisma.user.findMany({
    include: {
      wallets: true,
      pinnedTrades: { orderBy: { totalPnlSol: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
    take: 15,
  });

  traders = users.map(u => {
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

  // Fetch ticker items directly (no internal HTTP — same Prisma call as /api/ticker)
  ticker = await cached<TickerItem[]>('ticker:recent', 60, async () => {
    const rows = await prisma.pinnedTrade.findMany({
      orderBy: { pinnedAt: 'desc' },
      take: 20,
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
    return rows.map((r) => ({
      username: r.user.username,
      avatarUrl: r.user.avatarUrl,
      tokenSymbol: r.tokenSymbol,
      pnlPercent: r.totalPnlPercent,
      totalPnlSol: r.totalPnlSol,
      pinnedAt: r.pinnedAt.toISOString(),
    }));
  });

  } catch (err) {
    console.error('[landing] SSR error:', err);
  }

  const featured = traders[0] ?? null;

  return <LandingContent traders={traders} featured={featured} ticker={ticker} />;
}
