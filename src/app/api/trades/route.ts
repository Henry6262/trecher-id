import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWalletSwaps, aggregateTradesByToken } from '@/lib/helius';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = await rateLimit(`trades:${ip}`, 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');

    const wallets = walletAddress
      ? await prisma.wallet.findMany({ where: { userId: session.id, address: walletAddress } })
      : await prisma.wallet.findMany({ where: { userId: session.id } });

    if (wallets.length === 0) return NextResponse.json([]);

    const allTrades = [];
    for (const wallet of wallets) {
      try {
        const { txns: swaps } = await getWalletSwaps(wallet.address);
        const trades = await aggregateTradesByToken(swaps, wallet.address);
        allTrades.push(...trades.map((t) => ({ ...t, walletAddress: wallet.address })));
      } catch (err) {
        logger.error('api/trades', `Failed to fetch trades for wallet ${wallet.address}`, err);
        // Continue to next wallet instead of failing entirely
      }
    }

    const response = NextResponse.json(allTrades);
    // Add cache headers for the user session (private)
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (err) {
    logger.error('api/trades', 'Failed to fetch trades', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
