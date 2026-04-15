import type { TokenTrade } from './helius';

export interface TraderStats {
  roi: number;
  avgTradeSize: number;
  bestTrade: { symbol: string; pnlPercent: number } | null;
  worstTrade: { symbol: string; pnlPercent: number } | null;
  winStreak: number;
  avgHoldTime: string;
  consistency: number;
  totalBuySol: number;
  totalSellSol: number;
}

function formatHoldTime(ms: number): string {
  const minutes = ms / 60_000;
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

export function computeTraderStats(trades: TokenTrade[]): TraderStats {
  if (trades.length === 0) {
    return {
      roi: 0,
      avgTradeSize: 0,
      bestTrade: null,
      worstTrade: null,
      winStreak: 0,
      avgHoldTime: '0m',
      consistency: 0,
      totalBuySol: 0,
      totalSellSol: 0,
    };
  }

  let totalBuySol = 0;
  let totalSellSol = 0;

  for (const trade of trades) {
    for (const tx of trade.transactions) {
      if (tx.type === 'BUY') totalBuySol += tx.amountSol;
      else totalSellSol += tx.amountSol;
    }
  }

  // ROI
  const roi = totalBuySol > 0.001 ? ((totalSellSol / totalBuySol) - 1) * 100 : 0;

  // Avg trade size
  const avgTradeSize = trades.length > 0 ? totalBuySol / trades.length : 0;

  // Best / worst trade
  let bestTrade: TraderStats['bestTrade'] = null;
  let worstTrade: TraderStats['worstTrade'] = null;

  for (const trade of trades) {
    const pct = trade.totalPnlPercent;
    if (pct === null) continue;
    if (!bestTrade || pct > bestTrade.pnlPercent) {
      bestTrade = { symbol: trade.tokenSymbol, pnlPercent: pct };
    }
    if (!worstTrade || pct < worstTrade.pnlPercent) {
      worstTrade = { symbol: trade.tokenSymbol, pnlPercent: pct };
    }
  }

  // Win streak — sort by first transaction timestamp
  const sorted = [...trades].sort((a, b) => {
    const aTime = a.transactions[0]?.timestamp ?? 0;
    const bTime = b.transactions[0]?.timestamp ?? 0;
    return aTime - bTime;
  });

  let winStreak = 0;
  let currentStreak = 0;
  for (const trade of sorted) {
    if (trade.totalPnlSol > 0) {
      currentStreak++;
      if (currentStreak > winStreak) winStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Avg hold time
  let totalHoldMs = 0;
  let holdCount = 0;
  for (const trade of trades) {
    const buys = trade.transactions.filter((t) => t.type === 'BUY');
    const sells = trade.transactions.filter((t) => t.type === 'SELL');
    if (buys.length > 0 && sells.length > 0) {
      const firstBuy = Math.min(...buys.map((t) => t.timestamp));
      const lastSell = Math.max(...sells.map((t) => t.timestamp));
      totalHoldMs += (lastSell - firstBuy) * 1000; // timestamps are in seconds
      holdCount++;
    }
  }
  const avgHoldTime = holdCount > 0 ? formatHoldTime(totalHoldMs / holdCount) : '0m';

  // Consistency — 100 - min(stddev of pnl percents, 100)
  const pnlPercents = trades.map((t) => t.totalPnlPercent).filter((v): v is number => v !== null);
  const mean = pnlPercents.length > 0 ? pnlPercents.reduce((s, v) => s + v, 0) / pnlPercents.length : 0;
  const variance = pnlPercents.length > 0 ? pnlPercents.reduce((s, v) => s + (v - mean) ** 2, 0) / pnlPercents.length : 0;
  const stddev = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - Math.min(stddev, 100));

  return {
    roi,
    avgTradeSize,
    bestTrade,
    worstTrade,
    winStreak,
    avgHoldTime,
    consistency,
    totalBuySol,
    totalSellSol,
  };
}
