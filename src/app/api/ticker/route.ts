import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cached } from '@/lib/redis';

export const runtime = 'nodejs';

export interface TickerItem {
  username: string;
  avatarUrl: string | null;
  tokenSymbol: string;
  pnlPercent: number;
  totalPnlSol: number;
  pinnedAt: string; // ISO string
}

export async function GET() {
  const items = await cached<TickerItem[]>('ticker:recent', 60, async () => {
    const rows = await prisma.pinnedTrade.findMany({
      orderBy: { pinnedAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { username: true, avatarUrl: true },
        },
      },
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

  return NextResponse.json(items);
}
