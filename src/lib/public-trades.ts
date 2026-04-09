import { aggregateTradesByToken, getWalletTransactions, type TokenTrade } from './helius';
import { cachedWithStale } from './redis';
import { prisma } from './prisma';

const PUBLIC_TRADE_CACHE_FRESH_TTL_SECONDS = 300;
const PUBLIC_TRADE_CACHE_STALE_TTL_SECONDS = 1800;
const PUBLIC_TRADE_LOOKBACK_DAYS = 90;
const PUBLIC_TRADE_MAX_PAGES = 20;

interface ExactWalletTradeSnapshot {
  trades: TokenTrade[];
  fetchedAt: string;
}

function getExactWalletTradeCacheKey(address: string): string {
  return `profile:exact-wallet-trades:v1:${address.toLowerCase()}`;
}

async function getExactWalletTrades(address: string): Promise<ExactWalletTradeSnapshot> {
  return cachedWithStale(
    getExactWalletTradeCacheKey(address),
    PUBLIC_TRADE_CACHE_FRESH_TTL_SECONDS,
    PUBLIC_TRADE_CACHE_STALE_TTL_SECONDS,
    async () => {
      const { txns } = await getWalletTransactions(address, { maxPages: PUBLIC_TRADE_MAX_PAGES });
      const trades = await aggregateTradesByToken(txns, address, PUBLIC_TRADE_LOOKBACK_DAYS);

      return {
        trades,
        fetchedAt: new Date().toISOString(),
      };
    },
  );
}

function buildTradesFromDbEvents(
  rows: {
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string | null;
    tokenImageUrl: string | null;
    type: string;
    amountSol: number;
    timestamp: Date;
  }[],
): TokenTrade[] {
  const tradeMap = new Map<
    string,
    {
      tokenSymbol: string;
      tokenName: string;
      tokenImage: string | null;
      buySol: number;
      sellSol: number;
      transactions: TokenTrade['transactions'];
    }
  >();

  for (const row of rows) {
    if (!tradeMap.has(row.tokenMint)) {
      tradeMap.set(row.tokenMint, {
        tokenSymbol: row.tokenSymbol || row.tokenMint.slice(0, 6),
        tokenName: row.tokenName ?? '',
        tokenImage: row.tokenImageUrl,
        buySol: 0,
        sellSol: 0,
        transactions: [],
      });
    }

    const entry = tradeMap.get(row.tokenMint)!;
    if (row.type === 'BUY') entry.buySol += row.amountSol;
    if (row.type === 'SELL') entry.sellSol += row.amountSol;
    entry.transactions.push({
      type: row.type === 'SELL' ? 'SELL' : 'BUY',
      amountSol: row.amountSol,
      mcap: 0,
      timestamp: Math.floor(row.timestamp.getTime() / 1000),
    });
  }

  return Array.from(tradeMap.entries())
    .map(([tokenMint, entry]) => {
      const totalPnlSol = entry.sellSol - entry.buySol;
      const totalPnlPercent = entry.buySol > 0.001
        ? ((entry.sellSol - entry.buySol) / entry.buySol) * 100
        : 0;

      return {
        tokenMint,
        tokenSymbol: entry.tokenSymbol,
        tokenName: entry.tokenName,
        tokenImage: entry.tokenImage,
        transactions: entry.transactions.sort((a, b) => a.timestamp - b.timestamp),
        totalPnlSol,
        totalPnlPercent,
      };
    })
    .filter((trade) => trade.transactions.length > 0)
    .sort((a, b) => b.totalPnlSol - a.totalPnlSol);
}

export interface PublicTradeResolution {
  trades: TokenTrade[];
  exactWalletCoverage: number;
  fetchedAt: string | null;
  lookbackDays: number;
}

export async function getExactPublicTrades(addresses: string[]): Promise<PublicTradeResolution> {
  const uniqueAddresses = Array.from(new Set(addresses.filter(Boolean)));
  const wallets = uniqueAddresses.length > 0
    ? await prisma.wallet.findMany({
        where: { address: { in: uniqueAddresses } },
        select: { id: true, address: true },
      })
    : [];

  if (wallets.length > 0) {
    const rows = await prisma.walletTradeEvent.findMany({
      where: { walletId: { in: wallets.map((wallet) => wallet.id) } },
      select: {
        walletId: true,
        tokenMint: true,
        tokenSymbol: true,
        tokenName: true,
        tokenImageUrl: true,
        type: true,
        amountSol: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    if (rows.length > 0) {
      return {
        trades: buildTradesFromDbEvents(rows),
        exactWalletCoverage: new Set(rows.map((row) => row.walletId)).size,
        fetchedAt: new Date().toISOString(),
        lookbackDays: PUBLIC_TRADE_LOOKBACK_DAYS,
      };
    }
  }

  const allTrades: TokenTrade[] = [];
  let exactWalletCoverage = 0;
  let latestFetchedAt: string | null = null;

  for (const address of uniqueAddresses) {
    try {
      const snapshot = await getExactWalletTrades(address);
      allTrades.push(...snapshot.trades);
      exactWalletCoverage += 1;

      if (!latestFetchedAt || snapshot.fetchedAt > latestFetchedAt) {
        latestFetchedAt = snapshot.fetchedAt;
      }
    } catch {
      // Skip failed wallets and let callers decide whether to fall back.
    }
  }

  return {
    trades: allTrades.sort((a, b) => b.totalPnlSol - a.totalPnlSol),
    exactWalletCoverage,
    fetchedAt: latestFetchedAt,
    lookbackDays: PUBLIC_TRADE_LOOKBACK_DAYS,
  };
}
