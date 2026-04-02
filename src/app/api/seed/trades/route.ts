import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWalletSwaps, aggregateTradesByToken } from '@/lib/helius';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pinCount = parseInt(searchParams.get('pin') ?? '3', 10);
  const limit = parseInt(searchParams.get('limit') ?? '10', 10);
  const clearExisting = searchParams.get('clear') === 'true';

  const users = await prisma.user.findMany({
    include: { wallets: true, pinnedTrades: true },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  const results: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    if (user.pinnedTrades.length > 0 && !clearExisting) {
      results.push(`${user.displayName} — already has ${user.pinnedTrades.length} pinned, skipped`);
      continue;
    }
    if (clearExisting) {
      await prisma.pinnedTrade.deleteMany({ where: { userId: user.id } });
    }

    for (const wallet of user.wallets) {
      try {
        const { txns } = await getWalletSwaps(wallet.address);
        // aggregateTradesByToken is now async (fetches DAS metadata)
        const trades = await aggregateTradesByToken(txns, wallet.address, 7);

        if (trades.length === 0) {
          results.push(`${user.displayName} — no swaps in last 7 days`);
          continue;
        }

        // Only pin winners (positive PnL SOL), sorted by biggest gain
        const winners = trades
          .filter(t => t.totalPnlSol > 0.01 && t.transactions.length >= 1)
          .slice(0, pinCount);

        // If no winners, take top trades by activity
        const toPinn = winners.length > 0 ? winners : trades.slice(0, pinCount);

        for (let i = 0; i < toPinn.length; i++) {
          const trade = toPinn[i];
          await prisma.pinnedTrade.create({
            data: {
              userId: user.id,
              walletAddress: wallet.address,
              tokenMint: trade.tokenMint,
              tokenSymbol: trade.tokenSymbol,
              tokenName: trade.tokenName || null,
              tokenImageUrl: trade.tokenImage || null,
              totalPnlPercent: trade.totalPnlPercent,
              totalPnlSol: trade.totalPnlSol,
              order: i,
              transactions: trade.transactions.map(tx => ({
                type: tx.type,
                mcap: tx.mcap,
                amountSol: tx.amountSol,
              })),
            },
          });
        }

        results.push(`${user.displayName} — pinned ${toPinn.length} trades (${winners.length} winners) from ${trades.length} tokens`);
        await new Promise(r => setTimeout(r, 300));

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${user.displayName}: ${msg}`);
      }
    }
  }

  return NextResponse.json({ processed: users.length, results, errors });
}
