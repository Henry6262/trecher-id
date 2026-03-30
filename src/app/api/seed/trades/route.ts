import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWalletSwaps, aggregateTradesByToken } from '@/lib/helius';

// Token metadata cache — avoid refetching for tokens we've already seen
const tokenMetaCache = new Map<string, { symbol: string; name: string }>();

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // How many top trades to auto-pin per KOL
  const pinCount = parseInt(searchParams.get('pin') ?? '3', 10);
  // Limit how many KOLs to process (Helius rate limits)
  const limit = parseInt(searchParams.get('limit') ?? '10', 10);

  const users = await prisma.user.findMany({
    include: {
      wallets: true,
      pinnedTrades: true,
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  const results: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    // Skip users who already have pinned trades
    if (user.pinnedTrades.length > 0) {
      results.push(`${user.displayName} — already has ${user.pinnedTrades.length} pinned trades, skipped`);
      continue;
    }

    for (const wallet of user.wallets) {
      try {
        const swaps = await getWalletSwaps(wallet.address);
        const trades = aggregateTradesByToken(swaps);

        if (trades.length === 0) {
          results.push(`${user.displayName} (${wallet.address.slice(0, 6)}...) — no trades found`);
          continue;
        }

        // Pick the best trades (highest PnL %)
        const bestTrades = trades
          .filter(t => t.totalPnlPercent > 0)
          .slice(0, pinCount);

        for (let i = 0; i < bestTrades.length; i++) {
          const trade = bestTrades[i];

          // Check cache for token metadata
          let tokenName = tokenMetaCache.get(trade.tokenMint)?.name ?? null;
          let tokenSymbol = trade.tokenSymbol;
          const cached = tokenMetaCache.get(trade.tokenMint);
          if (cached) {
            tokenSymbol = cached.symbol;
            tokenName = cached.name;
          } else {
            // Cache what we have
            tokenMetaCache.set(trade.tokenMint, { symbol: tokenSymbol, name: tokenName ?? tokenSymbol });
          }

          await prisma.pinnedTrade.create({
            data: {
              userId: user.id,
              walletAddress: wallet.address,
              tokenMint: trade.tokenMint,
              tokenSymbol,
              tokenName,
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

        results.push(`${user.displayName} — pinned ${bestTrades.length} best trades from ${trades.length} total`);

        // Small delay to avoid Helius rate limits
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${user.displayName}: ${msg}`);
      }
    }
  }

  return NextResponse.json({
    processed: users.length,
    results,
    errors,
    tokensCached: tokenMetaCache.size,
  });
}
