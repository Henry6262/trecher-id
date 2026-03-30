import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWalletSwaps, aggregateTradesByToken } from '@/lib/helius';

export async function GET(req: Request) {
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
    const swaps = await getWalletSwaps(wallet.address);
    const trades = await aggregateTradesByToken(swaps, wallet.address);
    allTrades.push(...trades.map((t) => ({ ...t, walletAddress: wallet.address })));
  }

  return NextResponse.json(allTrades);
}
