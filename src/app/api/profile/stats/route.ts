import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID = ['1d', '3d', '7d', '14d', 'all'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const period = searchParams.get('period') ?? 'all';
  if (!username || !VALID.includes(period)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, wallets: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const ranking = await prisma.userRanking.findUnique({ where: { userId_period: { userId: user.id, period } } });

  // Fetch holdings for all wallets
  const holdings = await prisma.tokenHolding.findMany({
    where: { walletId: { in: user.wallets.map((w) => w.id) } },
    select: {
      tokenSymbol: true,
      tokenName: true,
      amount: true,
      valueUsd: true,
    },
  });

  return NextResponse.json({
    pnlUsd: ranking?.pnlUsd || 0,
    winRate: ranking?.winRate || 0,
    trades: ranking?.trades || 0,
    rank: ranking?.rank || null,
    period,
    holdings: holdings.map((h) => ({
      tokenSymbol: h.tokenSymbol,
      tokenName: h.tokenName,
      amount: h.amount,
      valueUsd: h.valueUsd,
    })),
  });
}
