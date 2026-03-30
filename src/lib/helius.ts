const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_BASE = 'https://api.helius.xyz/v0';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// ─── Token Metadata via Helius DAS ────────────────────────────

interface TokenMeta {
  symbol: string;
  name: string;
  image: string | null;
}

const metadataCache = new Map<string, TokenMeta>();

export async function getTokenMetadata(mints: string[]): Promise<Map<string, TokenMeta>> {
  const uncached = mints.filter(m => !metadataCache.has(m));

  if (uncached.length > 0) {
    try {
      const res = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'trench-id',
          method: 'getAssetBatch',
          params: { ids: uncached },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assets = data.result || [];
        for (const asset of assets) {
          if (asset && asset.id) {
            metadataCache.set(asset.id, {
              symbol: asset.content?.metadata?.symbol || asset.id.slice(0, 6),
              name: asset.content?.metadata?.name || '',
              image: asset.content?.links?.image || asset.content?.files?.[0]?.uri || null,
            });
          }
        }
      }
    } catch {
      // Fallback silently
    }
  }

  for (const m of mints) {
    if (!metadataCache.has(m)) {
      metadataCache.set(m, { symbol: m.slice(0, 6), name: '', image: null });
    }
  }

  return metadataCache;
}

// ─── Transaction Fetching ─────────────────────────────────────

interface HeliusTokenTransfer {
  mint: string;
  tokenAmount: number;
  fromUserAccount: string;
  toUserAccount: string;
}

interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
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

export async function getWalletTransactions(walletAddress: string): Promise<HeliusTransaction[]> {
  if (!HELIUS_API_KEY) throw new Error('HELIUS_API_KEY not set');
  const url = `${HELIUS_BASE}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Helius API error: ${res.status}`);
  return res.json();
}

export const getWalletSwaps = getWalletTransactions;

// ─── Trade Aggregation ────────────────────────────────────────

export interface TokenTrade {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImage: string | null;
  transactions: {
    type: 'BUY' | 'SELL';
    amountSol: number;
    mcap: number;
    timestamp: number;
  }[];
  totalPnlSol: number;
  totalPnlPercent: number;
}

export async function aggregateTradesByToken(
  txns: HeliusTransaction[],
  walletAddress: string,
  daysBack: number = 3,
): Promise<TokenTrade[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400;

  const tokenMap = new Map<
    string,
    { buySol: number; sellSol: number; txns: TokenTrade['transactions'] }
  >();

  for (const tx of txns) {
    if (tx.timestamp < cutoff) continue;
    if (tx.type !== 'SWAP') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];

    const nonSolToken = tokenTransfers.find(t => t.mint !== SOL_MINT);
    if (!nonSolToken) continue;

    const tokenMint = nonSolToken.mint;

    // Calculate net SOL flow for this wallet
    let solSent = 0;
    let solReceived = 0;
    for (const nt of nativeTransfers) {
      if (nt.fromUserAccount === walletAddress) solSent += nt.amount;
      if (nt.toUserAccount === walletAddress) solReceived += nt.amount;
    }
    for (const tt of tokenTransfers) {
      if (tt.mint === SOL_MINT) {
        if (tt.fromUserAccount === walletAddress) solSent += tt.tokenAmount * 1e9;
        if (tt.toUserAccount === walletAddress) solReceived += tt.tokenAmount * 1e9;
      }
    }

    const netSolSpent = (solSent - solReceived) / 1e9;
    const netSolGained = (solReceived - solSent) / 1e9;

    const tokenReceived = nonSolToken.toUserAccount === walletAddress;
    const tokenSent = nonSolToken.fromUserAccount === walletAddress;

    if (!tokenMap.has(tokenMint)) {
      tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, txns: [] });
    }
    const entry = tokenMap.get(tokenMint)!;

    if (tokenReceived && netSolSpent > 0.001) {
      entry.buySol += netSolSpent;
      entry.txns.push({ type: 'BUY', amountSol: netSolSpent, mcap: 0, timestamp: tx.timestamp });
    } else if (tokenSent && netSolGained > 0.001) {
      entry.sellSol += netSolGained;
      entry.txns.push({ type: 'SELL', amountSol: netSolGained, mcap: 0, timestamp: tx.timestamp });
    }
  }

  // Fetch token metadata via DAS
  const allMints = Array.from(tokenMap.keys());
  const metadata = await getTokenMetadata(allMints);

  const trades: TokenTrade[] = [];
  for (const [mint, data] of tokenMap) {
    if (data.txns.length === 0) continue;
    const meta = metadata.get(mint) || { symbol: mint.slice(0, 6), name: '', image: null };
    const pnlSol = data.sellSol - data.buySol;
    const pnlPercent = data.buySol > 0.001
      ? ((data.sellSol - data.buySol) / data.buySol) * 100
      : 0;
    trades.push({
      tokenMint: mint,
      tokenSymbol: meta.symbol,
      tokenName: meta.name,
      tokenImage: meta.image,
      transactions: data.txns.sort((a, b) => a.timestamp - b.timestamp),
      totalPnlSol: pnlSol,
      totalPnlPercent: pnlPercent,
    });
  }

  return trades.sort((a, b) => b.totalPnlSol - a.totalPnlSol);
}
