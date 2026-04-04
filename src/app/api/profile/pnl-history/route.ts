import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, wallets: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const walletIds = user.wallets.map(w => w.id);
  if (walletIds.length === 0) return NextResponse.json([]);

  // Get all WalletTrade records and bucket by day (lastTradeAt)
  const trades = await prisma.walletTrade.findMany({
    where: { walletId: { in: walletIds } },
    select: { pnlSol: true, lastTradeAt: true },
    orderBy: { lastTradeAt: 'asc' },
  });

  // Aggregate PnL by day
  const dailyMap = new Map<string, number>();
  for (const t of trades) {
    const day = t.lastTradeAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + t.pnlSol);
  }

  // Build cumulative series
  let cumulative = 0;
  const series = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, pnl]) => {
      cumulative += pnl;
      return { time, value: Math.round(cumulative * 100) / 100 };
    });

  return NextResponse.json(series, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
