import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { username },
    select: { wallets: { select: { id: true } } },
  });

  if (!user || user.wallets.length === 0) return NextResponse.json([]);

  const trades = await prisma.walletTradeEvent.findMany({
    where: { walletId: { in: user.wallets.map((w) => w.id) } },
    select: {
      id: true,
      tokenSymbol: true,
      tokenName: true,
      tokenImageUrl: true,
      type: true,
      amountSol: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return NextResponse.json(
    trades.map((t) => ({
      id: t.id,
      tokenSymbol: t.tokenSymbol,
      tokenName: t.tokenName,
      tokenImageUrl: t.tokenImageUrl,
      type: t.type,
      amountSol: t.amountSol,
      timestamp: t.timestamp,
    })),
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    },
  );
}
