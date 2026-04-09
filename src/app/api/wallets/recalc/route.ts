import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSolPrice } from '@/lib/sol-price';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { markWalletTradeRebuildFailure, rebuildWalletTradeData } from '@/lib/wallet-trade-rebuild';

export const maxDuration = 300;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const walletAddress = searchParams.get('wallet');
  const solPrice = await getSolPrice();

  const wallets = walletAddress
    ? await prisma.wallet.findMany({ where: { address: walletAddress }, include: { user: true } })
    : await prisma.wallet.findMany({ include: { user: true } });

  const results: { wallet: string; before: number; after: number; trades: number }[] = [];
  const errors: { wallet: string; error: string }[] = [];

  for (const wallet of wallets) {
    try {
      const rebuild = await rebuildWalletTradeData({
        walletId: wallet.id,
        walletAddress: wallet.address,
        userId: wallet.userId,
        solPrice,
        maxPages: 50,
      });

      results.push({
        wallet: wallet.address,
        before: Math.round(rebuild.beforePnlSol * 100) / 100,
        after: Math.round(rebuild.afterPnlSol * 100) / 100,
        trades: rebuild.tradeRows,
      });

      await invalidatePublicProfileCache(wallet.user.username);
      await sleep(3000);
    } catch (err) {
      await markWalletTradeRebuildFailure(wallet.id, err instanceof Error ? err.message : String(err));
      errors.push({ wallet: wallet.address, error: String(err) });
      await sleep(3000);
    }
  }

  return NextResponse.json({
    ok: true,
    walletsProcessed: results.length,
    errors: errors.length > 0 ? errors : undefined,
    results,
    solPrice,
  });
}
