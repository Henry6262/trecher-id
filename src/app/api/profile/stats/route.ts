import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID = ['1d', '3d', '7d', '14d', 'all'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const period = searchParams.get('period') ?? 'all';
  if (!username || !VALID.includes(period)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const ranking = await prisma.userRanking.findUnique({ where: { userId_period: { userId: user.id, period } } });
  if (!ranking) return NextResponse.json(null);

  return NextResponse.json({
    pnlUsd: ranking.pnlUsd,
    winRate: ranking.winRate,
    trades: ranking.trades,
    rank: ranking.rank,
    period,
  });
}
