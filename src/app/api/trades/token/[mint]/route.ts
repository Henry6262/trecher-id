import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Smart Money API for the web3me Twitter extension.
 * Returns a list of ranked traders who have positions in a specific token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const ip = getClientIp(request);
    const { allowed } = await rateLimit(`token_trades:${ip}`, 60, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { mint } = await params;

    if (!mint) {
      return NextResponse.json({ error: 'Token mint is required' }, { status: 400 });
    }

    // Find ranked traders who have traded this token
    const trades = await prisma.walletTrade.findMany({
      where: {
        tokenMint: mint,
        wallet: {
          user: {
            rankings: {
              some: {
                period: '7d',
                rank: { lte: 100 } // Top 100 traders
              }
            }
          }
        }
      },
      include: {
        wallet: {
          include: {
            user: {
              include: {
                rankings: {
                  where: { period: '7d' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { pnlSol: 'desc' },
      take: 5
    });

    const smartMoney = trades.map(t => ({
      username: t.wallet.user.username,
      displayName: t.wallet.user.displayName,
      avatarUrl: t.wallet.user.avatarUrl,
      rank: t.wallet.user.rankings[0]?.rank,
      pnlSol: t.pnlSol,
      tradeCount: t.tradeCount,
      lastTradeAt: t.lastTradeAt
    }));

    const response = NextResponse.json({
      mint,
      traderCount: smartMoney.length,
      traders: smartMoney
    });
    
    // Cache for 5 minutes (extension-friendly)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    logger.error('api/trades/token/[mint]', 'Failed to fetch token trades', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
