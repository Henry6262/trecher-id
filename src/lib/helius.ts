const HELIUS_BASE = 'https://api.helius.xyz/v0';

interface HeliusTokenTransfer {
  mint: string;
  tokenAmount: number;
  fromUserAccount: string;
  toUserAccount: string;
}

interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number; // lamports
}

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  description: string;
  tokenTransfers: HeliusTokenTransfer[];
  nativeTransfers: HeliusNativeTransfer[];
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const KNOWN_DEXES = ['JUPITER', 'RAYDIUM', 'PUMP_FUN', 'ORCA', 'METEORA', 'PHOENIX', 'LIFINITY'];

export async function getWalletTransactions(walletAddress: string): Promise<HeliusTransaction[]> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) throw new Error('HELIUS_API_KEY not set');
  const url = `${HELIUS_BASE}/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Helius API error: ${res.status}`);
  return res.json();
}

export const getWalletSwaps = getWalletTransactions;

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

export function aggregateTradesByToken(txns: HeliusTransaction[], walletAddress: string): TokenTrade[] {
  const tokenMap = new Map<
    string,
    { buySol: number; sellSol: number; txns: TokenTrade['transactions'] }
  >();

  for (const tx of txns) {
    // Only process swaps from known DEXes
    if (tx.type !== 'SWAP' && !KNOWN_DEXES.includes(tx.source)) continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];

    // Find non-SOL token involved
    const nonSolToken = tokenTransfers.find(t => t.mint !== SOL_MINT);
    if (!nonSolToken) continue;

    const tokenMint = nonSolToken.mint;

    // Calculate SOL in/out for this wallet
    let solOut = 0; // SOL wallet sent
    let solIn = 0;  // SOL wallet received
    for (const nt of nativeTransfers) {
      if (nt.fromUserAccount === walletAddress) {
        solOut += nt.amount / 1e9;
      }
      if (nt.toUserAccount === walletAddress) {
        solIn += nt.amount / 1e9;
      }
    }

    // Also check SOL token transfers (wrapped SOL)
    for (const tt of tokenTransfers) {
      if (tt.mint === SOL_MINT) {
        if (tt.fromUserAccount === walletAddress) solOut += tt.tokenAmount;
        if (tt.toUserAccount === walletAddress) solIn += tt.tokenAmount;
      }
    }

    // Determine if BUY or SELL
    const tokenSentOut = nonSolToken.fromUserAccount === walletAddress;
    const tokenReceived = nonSolToken.toUserAccount === walletAddress;

    if (!tokenMap.has(tokenMint)) {
      tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, txns: [] });
    }
    const entry = tokenMap.get(tokenMint)!;

    if (tokenReceived && solOut > 0.001) {
      // Wallet spent SOL, received tokens = BUY
      entry.buySol += solOut;
      entry.txns.push({ type: 'BUY', amountSol: solOut, mcap: 0, timestamp: tx.timestamp });
    } else if (tokenSentOut && solIn > 0.001) {
      // Wallet sent tokens, received SOL = SELL
      entry.sellSol += solIn;
      entry.txns.push({ type: 'SELL', amountSol: solIn, mcap: 0, timestamp: tx.timestamp });
    } else if (tokenReceived && !tokenSentOut) {
      // Got tokens but no clear SOL movement (maybe bundled) — treat as BUY with minimal SOL
      const minSol = solOut > 0 ? solOut : 0.01;
      entry.buySol += minSol;
      entry.txns.push({ type: 'BUY', amountSol: minSol, mcap: 0, timestamp: tx.timestamp });
    } else if (tokenSentOut && !tokenReceived) {
      // Sent tokens but no clear SOL received — treat as SELL
      const minSol = solIn > 0 ? solIn : 0.01;
      entry.sellSol += minSol;
      entry.txns.push({ type: 'SELL', amountSol: minSol, mcap: 0, timestamp: tx.timestamp });
    }
  }

  const trades: TokenTrade[] = [];
  for (const [mint, data] of tokenMap) {
    if (data.txns.length === 0) continue;
    const pnlSol = data.sellSol - data.buySol;
    const pnlPercent = data.buySol > 0.001
      ? ((data.sellSol - data.buySol) / data.buySol) * 100
      : 0;
    trades.push({
      tokenMint: mint,
      tokenSymbol: mint.slice(0, 6).toUpperCase(),
      transactions: data.txns.sort((a, b) => a.timestamp - b.timestamp),
      totalPnlSol: pnlSol,
      totalPnlPercent: pnlPercent,
    });
  }

  // Sort by absolute PnL (best performers first, then worst)
  return trades.sort((a, b) => b.totalPnlPercent - a.totalPnlPercent);
}
