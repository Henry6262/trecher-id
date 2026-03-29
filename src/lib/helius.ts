const HELIUS_BASE = 'https://api.helius.xyz/v0';

interface HeliusSwap {
  tokenInputs: { mint: string; tokenAmount: number }[];
  tokenOutputs: { mint: string; tokenAmount: number }[];
  nativeInput?: { amount: number };
  nativeOutput?: { amount: number };
}

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  events?: { swap?: HeliusSwap };
}

export async function getWalletSwaps(walletAddress: string): Promise<HeliusTransaction[]> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) throw new Error('HELIUS_API_KEY not set');
  const url = `${HELIUS_BASE}/addresses/${walletAddress}/transactions?api-key=${apiKey}&type=SWAP`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Helius API error: ${res.status}`);
  return res.json();
}

export interface TokenTrade {
  tokenMint: string;
  tokenSymbol: string;
  transactions: {
    type: 'BUY' | 'SELL';
    amountSol: number;
    mcap: number;
    timestamp: number;
  }[];
  totalPnlSol: number;
  totalPnlPercent: number;
}

export function aggregateTradesByToken(swaps: HeliusTransaction[]): TokenTrade[] {
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const tokenMap = new Map<
    string,
    { buySol: number; sellSol: number; txns: TokenTrade['transactions'] }
  >();

  for (const tx of swaps) {
    const swap = tx.events?.swap;
    if (!swap) continue;

    const solIn = (swap.nativeInput?.amount ?? 0) / 1e9;
    const solOut = (swap.nativeOutput?.amount ?? 0) / 1e9;
    const tokenInput = swap.tokenInputs.find((t) => t.mint !== SOL_MINT);
    const tokenOutput = swap.tokenOutputs.find((t) => t.mint !== SOL_MINT);
    const tokenMint = tokenOutput?.mint ?? tokenInput?.mint;
    if (!tokenMint) continue;

    if (!tokenMap.has(tokenMint)) {
      tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, txns: [] });
    }
    const entry = tokenMap.get(tokenMint)!;

    if (solIn > 0 && tokenOutput) {
      entry.buySol += solIn;
      entry.txns.push({ type: 'BUY', amountSol: solIn, mcap: 0, timestamp: tx.timestamp });
    } else if (solOut > 0 && tokenInput) {
      entry.sellSol += solOut;
      entry.txns.push({ type: 'SELL', amountSol: solOut, mcap: 0, timestamp: tx.timestamp });
    }
  }

  const trades: TokenTrade[] = [];
  for (const [mint, data] of tokenMap) {
    const pnlSol = data.sellSol - data.buySol;
    const pnlPercent =
      data.buySol > 0 ? ((data.sellSol - data.buySol) / data.buySol) * 100 : 0;
    trades.push({
      tokenMint: mint,
      tokenSymbol: mint.slice(0, 4).toUpperCase(),
      transactions: data.txns.sort((a, b) => a.timestamp - b.timestamp),
      totalPnlSol: pnlSol,
      totalPnlPercent: pnlPercent,
    });
  }

  return trades.sort((a, b) => b.totalPnlPercent - a.totalPnlPercent);
}
