import type { FetchResult } from './helius';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface ParsedWalletTradeAggregate {
  buySol: number;
  sellSol: number;
  count: number;
  firstAt: number;
  lastAt: number;
}

export interface ParsedWalletTradeEvent {
  signature: string;
  tokenMint: string;
  type: 'BUY' | 'SELL';
  amountSol: number;
  timestamp: number;
}

export interface ParsedWalletTrades {
  aggregates: Map<string, ParsedWalletTradeAggregate>;
  events: ParsedWalletTradeEvent[];
  candidateTxCount: number;
}

export function parseWalletTrades(
  txns: FetchResult['txns'],
  walletAddress: string,
): ParsedWalletTrades {
  const aggregates = new Map<string, ParsedWalletTradeAggregate>();
  const events: ParsedWalletTradeEvent[] = [];
  let candidateTxCount = 0;

  for (const tx of txns) {
    if (tx.type !== 'SWAP' && tx.type !== 'TRANSFER' && tx.type !== 'UNKNOWN') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    const accountData = tx.accountData || [];

    const nonSolTokens = tokenTransfers.filter((token) => token.mint !== SOL_MINT);
    if (nonSolTokens.length === 0) continue;

    if (tx.type !== 'SWAP') {
      const hasNativeFlow = nativeTransfers.some(
        (transfer) =>
          transfer.fromUserAccount === walletAddress || transfer.toUserAccount === walletAddress,
      );
      if (!hasNativeFlow) continue;
    }

    let solSpent = 0;
    let solReceived = 0;
    for (const transfer of nativeTransfers) {
      const amountSol = transfer.amount / 1e9;
      if (transfer.fromUserAccount === walletAddress) solSpent += amountSol;
      if (transfer.toUserAccount === walletAddress) solReceived += amountSol;
    }

    const effectiveNetSol =
      solSpent === 0 && solReceived === 0
        ? (accountData.find((account) => account.account === walletAddress)?.nativeBalanceChange ?? 0) /
          1e9
        : solReceived - solSpent;

    for (const token of nonSolTokens) {
      const tokenMint = token.mint;
      const tokenReceived = token.toUserAccount === walletAddress;
      const tokenSent = token.fromUserAccount === walletAddress;
      if (!tokenReceived && !tokenSent) continue;
      candidateTxCount++;

      if (!aggregates.has(tokenMint)) {
        aggregates.set(tokenMint, {
          buySol: 0,
          sellSol: 0,
          count: 0,
          firstAt: tx.timestamp,
          lastAt: tx.timestamp,
        });
      }

      const entry = aggregates.get(tokenMint)!;
      entry.firstAt = Math.min(entry.firstAt, tx.timestamp);
      entry.lastAt = Math.max(entry.lastAt, tx.timestamp);
      entry.count++;

      if (tokenReceived && effectiveNetSol < -0.0001) {
        const amountSol = Math.abs(effectiveNetSol);
        entry.buySol += amountSol;
        events.push({
          signature: tx.signature,
          tokenMint,
          type: 'BUY',
          amountSol,
          timestamp: tx.timestamp,
        });
      } else if (tokenSent && effectiveNetSol > 0.0001) {
        entry.sellSol += effectiveNetSol;
        events.push({
          signature: tx.signature,
          tokenMint,
          type: 'SELL',
          amountSol: effectiveNetSol,
          timestamp: tx.timestamp,
        });
      }

      break;
    }
  }

  return { aggregates, events, candidateTxCount };
}
