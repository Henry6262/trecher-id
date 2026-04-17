import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const VALID = ['1d', '3d', '7d', '14d', 'all'];

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = await rateLimit(`profile_stats:${ip}`, 100, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const period = searchParams.get('period') ?? 'all';
    
    if (!username || !VALID.includes(period)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, wallets: { select: { id: true } } },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ranking = await prisma.userRanking.findUnique({ 
      where: { userId_period: { userId: user.id, period } } 
    });

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

    const data = {
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
    };

    const response = NextResponse.json(data);
    // Allow public caching for profile stats
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (err) {
    logger.error('api/profile/stats', 'Failed to fetch profile stats', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
