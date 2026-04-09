import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAvatarRows } from '@/lib/avatar-resolution';
import { cached } from '@/lib/redis';

const VALID_PERIODS = ['1d', '3d', '7d', '14d', 'all'] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const periodParam = searchParams.get('period') ?? '7d';
  const period = VALID_PERIODS.includes(periodParam as (typeof VALID_PERIODS)[number])
    ? periodParam
    : '7d';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const data = await cached(`leaderboard:${period}:${offset}:${limit}`, 120, async () => {
    const rankedRows = await prisma.userRanking.findMany({
      where: { period, trades: { gt: 0 }, rank: { not: null } },
      orderBy: { rank: 'asc' },
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

    const rows = rankedRows.length > 0
      ? rankedRows
      : await prisma.userRanking.findMany({
          where: { period, trades: { gt: 0 } },
          orderBy: [
            { pnlUsd: 'desc' },
            { winRate: 'desc' },
            { trades: 'desc' },
            { userId: 'asc' },
          ],
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

    return resolveAvatarRows(rows.map((r, i) => ({
      rank: r.rank ?? (offset + i + 1),
      username: r.user.username,
      displayName: r.user.displayName,
      avatarUrl: r.user.avatarUrl,
      isClaimed: r.user.isClaimed,
      pnlUsd: r.pnlUsd,
      pnlSol: r.pnlSol,
      winRate: r.winRate,
      trades: r.trades,
      updatedAt: r.updatedAt,
    })));
  });

  return NextResponse.json(data);
}
