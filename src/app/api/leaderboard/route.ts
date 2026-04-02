import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_PERIODS = ['1d', '3d', '7d', 'all'] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const periodParam = searchParams.get('period') ?? '7d';
  const period = VALID_PERIODS.includes(periodParam as (typeof VALID_PERIODS)[number])
    ? periodParam
    : '7d';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const rankings = await prisma.userRanking.findMany({
    where: { period },
    orderBy: { pnlUsd: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          isClaimed: true,
        },
      },
    },
  });

  const data = rankings.map((r, i) => ({
    rank: offset + i + 1,
    username: r.user.username,
    displayName: r.user.displayName,
    avatarUrl: r.user.avatarUrl,
    isClaimed: r.user.isClaimed,
    pnlUsd: r.pnlUsd,
    pnlSol: r.pnlSol,
    winRate: r.winRate,
    trades: r.trades,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json(data);
}
