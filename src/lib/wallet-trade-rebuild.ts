import { getTokenMetadata, getWalletTransactions } from './helius';
import { prisma } from './prisma';
import { recordWalletSyncFailure, recordWalletSyncSuccess } from './wallet-sync-health';
import { parseWalletTrades } from './wallet-trade-parser';

const RANKING_PERIODS = [
  { key: '1d', ms: 1 * 86400 * 1000 },
  { key: '3d', ms: 3 * 86400 * 1000 },
  { key: '7d', ms: 7 * 86400 * 1000 },
  { key: '14d', ms: 14 * 86400 * 1000 },
] as const;

export interface RebuildWalletTradeDataInput {
  walletId: string;
  walletAddress: string;
  userId: string;
  solPrice: number;
  maxPages?: number;
}

export interface RebuildWalletTradeDataResult {
  beforePnlSol: number;
  afterPnlSol: number;
  fetchedTransactions: number;
  tradeRows: number;
  eventRows: number;
  newestSignature: string | null;
}

export async function rebuildWalletTradeData(
  input: RebuildWalletTradeDataInput,
): Promise<RebuildWalletTradeDataResult> {
  const attemptedAt = new Date();
  const [beforeTrades, beforeEventCount] = await Promise.all([
    prisma.walletTrade.findMany({
      where: { walletId: input.walletId },
      select: { pnlSol: true },
    }),
    prisma.walletTradeEvent.count({
      where: { walletId: input.walletId },
    }),
  ]);

  const beforePnlSol = beforeTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
  const hasExistingData = beforeTrades.length > 0 || beforeEventCount > 0;

  const {
    txns,
    newestSignature,
    oldestFetchedSignature,
    pagesFetched,
    previousCursorFound,
    reachedHistoryEnd,
    pageLimitReached,
  } = await getWalletTransactions(input.walletAddress, {
    maxPages: input.maxPages ?? 50,
  });

  if (hasExistingData && txns.length === 0) {
    throw new Error(
      `Refusing to replace existing wallet data with an empty fetch result for ${input.walletAddress}`,
    );
  }

  const parsed = parseWalletTrades(txns, input.walletAddress);
  const tokenMetadata = await getTokenMetadata(Array.from(parsed.aggregates.keys()));
  const rebuiltAt = new Date();

  const tradeRows = Array.from(parsed.aggregates.entries()).map(([tokenMint, data]) => {
    const meta = tokenMetadata.get(tokenMint);
    return {
      walletId: input.walletId,
      tokenMint,
      tokenSymbol: meta?.symbol || tokenMint.slice(0, 6),
      tokenName: meta?.name || null,
      tokenImageUrl: meta?.image || null,
      buySol: data.buySol,
      sellSol: data.sellSol,
      pnlSol: data.sellSol - data.buySol,
      tradeCount: data.count,
      firstTradeAt: new Date(data.firstAt * 1000),
      lastTradeAt: new Date(data.lastAt * 1000),
      updatedAt: rebuiltAt,
    };
  });

  const eventRows = parsed.events.map((event) => {
    const meta = tokenMetadata.get(event.tokenMint);
    return {
      walletId: input.walletId,
      signature: event.signature,
      tokenMint: event.tokenMint,
      tokenSymbol: meta?.symbol || event.tokenMint.slice(0, 6),
      tokenName: meta?.name || null,
      tokenImageUrl: meta?.image || null,
      type: event.type,
      amountSol: event.amountSol,
      timestamp: new Date(event.timestamp * 1000),
    };
  });
  const uniqueEventRows = Array.from(
    new Map(
      eventRows.map((eventRow) => [
        `${eventRow.walletId}:${eventRow.signature}:${eventRow.tokenMint}:${eventRow.type}`,
        eventRow,
      ]),
    ).values(),
  );
  const oldestExactEventAt =
    uniqueEventRows.length > 0
      ? uniqueEventRows.reduce(
          (oldest, eventRow) =>
            oldest == null || eventRow.timestamp < oldest ? eventRow.timestamp : oldest,
          null as Date | null,
        )
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.walletTrade.deleteMany({ where: { walletId: input.walletId } });
    await tx.walletTradeEvent.deleteMany({ where: { walletId: input.walletId } });

    if (tradeRows.length > 0) {
      await tx.walletTrade.createMany({ data: tradeRows });
    }

    if (uniqueEventRows.length > 0) {
      await tx.walletTradeEvent.createMany({
        data: uniqueEventRows,
        skipDuplicates: true,
      });
    }
  }, {
    maxWait: 10_000,
    timeout: 60_000,
  });

  await recordWalletSyncSuccess({
    walletId: input.walletId,
    syncMode: 'rebuild',
    attemptedAt,
    successfulAt: rebuiltAt,
    newestSignature,
    oldestFetchedSignature,
    previousSignature: null,
    txnsFetched: txns.length,
    candidateTxCount: parsed.candidateTxCount,
    tradeRows: tradeRows.length,
    eventRows: eventRows.length,
    pagesFetched,
    previousCursorFound,
    reachedHistoryEnd,
    pageLimitReached,
    oldestExactEventAt,
  });

  const afterPnlSol = await refreshUserRankingsFromWalletTrades(input.userId, input.solPrice);

  return {
    beforePnlSol,
    afterPnlSol,
    fetchedTransactions: txns.length,
    tradeRows: tradeRows.length,
    eventRows: uniqueEventRows.length,
    newestSignature,
  };
}

export async function markWalletTradeRebuildFailure(
  walletId: string,
  error: string,
): Promise<void> {
  await recordWalletSyncFailure({ walletId, syncMode: 'rebuild', error });
}

export async function refreshUserRankingsFromWalletTrades(
  userId: string,
  solPrice: number,
): Promise<number> {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true },
  });

  const walletIds = wallets.map((wallet) => wallet.id);
  const allTrades = walletIds.length > 0
    ? await prisma.walletTrade.findMany({
        where: { walletId: { in: walletIds } },
      })
    : [];

  const tradesByWallet = new Map<string, typeof allTrades>();
  for (const trade of allTrades) {
    const bucket = tradesByWallet.get(trade.walletId) ?? [];
    bucket.push(trade);
    tradesByWallet.set(trade.walletId, bucket);
  }

  await Promise.all(
    wallets.map(async (wallet) => {
      const walletTrades = tradesByWallet.get(wallet.id) ?? [];
      const totalTrades = walletTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
      const wins = walletTrades.reduce(
        (sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0),
        0,
      );
      const totalPnlSol = walletTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          totalPnlUsd: totalPnlSol * solPrice,
          winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
          totalTrades,
          statsUpdatedAt: new Date(),
        },
      });
    }),
  );

  const rankingRows: Array<{
    userId: string;
    period: string;
    pnlSol: number;
    pnlUsd: number;
    winRate: number;
    trades: number;
    updatedAt: Date;
  }> = [];

  const now = Date.now();
  for (const period of RANKING_PERIODS) {
    const cutoff = new Date(now - period.ms);
    const periodTrades = allTrades.filter((trade) => trade.lastTradeAt >= cutoff);
    const pnlSol = periodTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
    const totalTrades = periodTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
    const wins = periodTrades.reduce(
      (sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0),
      0,
    );
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    rankingRows.push({
      userId,
      period: period.key,
      pnlSol,
      pnlUsd: pnlSol * solPrice,
      winRate,
      trades: totalTrades,
      updatedAt: new Date(),
    });
  }

  const allTimePnlSol = allTrades.reduce((sum, trade) => sum + trade.pnlSol, 0);
  const allTimeTrades = allTrades.reduce((sum, trade) => sum + trade.tradeCount, 0);
  const allTimeWins = allTrades.reduce(
    (sum, trade) => sum + (trade.pnlSol > 0 ? trade.tradeCount : 0),
    0,
  );
  const allTimeWinRate = allTimeTrades > 0 ? (allTimeWins / allTimeTrades) * 100 : 0;

  rankingRows.push({
    userId,
    period: 'all',
    pnlSol: allTimePnlSol,
    pnlUsd: allTimePnlSol * solPrice,
    winRate: allTimeWinRate,
    trades: allTimeTrades,
    updatedAt: new Date(),
  });

  await prisma.userRanking.deleteMany({
    where: {
      userId,
      period: { in: rankingRows.map((row) => row.period) },
    },
  });

  await prisma.userRanking.createMany({
    data: rankingRows,
  });

  return allTimePnlSol;
}
