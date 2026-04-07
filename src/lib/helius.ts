import { redis } from './redis';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_BASE = 'https://api.helius.xyz/v0';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const TOKEN_METADATA_TTL_SECONDS = 60 * 60 * 24;

// ─── Token Metadata via Helius DAS ────────────────────────────

interface TokenMeta {
  symbol: string;
  name: string;
  image: string | null;
}

const metadataCache = new Map<string, TokenMeta>();

function getTokenMetadataCacheKey(mint: string): string {
  return `token-meta:${mint}`;
}

async function hydrateTokenMetadataFromRedis(mints: string[]): Promise<string[]> {
  if (mints.length === 0) return [];

  try {
    const cachedEntries = await redis.mget(mints.map(getTokenMetadataCacheKey));
    const misses: string[] = [];

    for (const [index, mint] of mints.entries()) {
      const payload = cachedEntries[index];
      if (!payload) {
        misses.push(mint);
        continue;
      }

      try {
        metadataCache.set(mint, JSON.parse(payload) as TokenMeta);
      } catch {
        misses.push(mint);
      }
    }

    return misses;
  } catch {
    return mints;
  }
}

async function persistTokenMetadataToRedis(entries: [string, TokenMeta][]): Promise<void> {
  if (entries.length === 0) return;

  try {
    const pipeline = redis.pipeline();
    for (const [mint, metadata] of entries) {
      pipeline.set(
        getTokenMetadataCacheKey(mint),
        JSON.stringify(metadata),
        'EX',
        TOKEN_METADATA_TTL_SECONDS,
      );
    }
    await pipeline.exec();
  } catch {
    // Redis down — local cache still helps
  }
}

export async function getTokenMetadata(mints: string[]): Promise<Map<string, TokenMeta>> {
  const uniqueMints = Array.from(new Set(mints.filter(Boolean)));
  let uncached = uniqueMints.filter(m => !metadataCache.has(m));

  if (uncached.length > 0) {
    uncached = await hydrateTokenMetadataFromRedis(uncached);
  }

  if (uncached.length > 0) {
    try {
      const res = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'web3me',
          method: 'getAssetBatch',
          params: { ids: uncached },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assets = data.result || [];
        const fetchedEntries: [string, TokenMeta][] = [];
        for (const asset of assets) {
          if (asset && asset.id) {
            const metadata = {
              symbol: asset.content?.metadata?.symbol || asset.id.slice(0, 6),
              name: asset.content?.metadata?.name || '',
              image: asset.content?.links?.image || asset.content?.files?.[0]?.uri || null,
            };
            metadataCache.set(asset.id, metadata);
            fetchedEntries.push([asset.id, metadata]);
          }
        }
        await persistTokenMetadataToRedis(fetchedEntries);
      }
    } catch {
      // Fallback silently
    }
  }

  for (const m of uniqueMints) {
    if (!metadataCache.has(m)) {
      metadataCache.set(m, { symbol: m.slice(0, 6), name: '', image: null });
    }
  }

  return new Map(uniqueMints.map((mint) => [mint, metadataCache.get(mint)!]));
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

interface HeliusAccountData {
  account: string;
  nativeBalanceChange: number; // lamports, positive = received, negative = spent
}

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  description: string;
  tokenTransfers: HeliusTokenTransfer[];
  nativeTransfers: HeliusNativeTransfer[];
  accountData: HeliusAccountData[];
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface FetchResult {
  txns: HeliusTransaction[];
  newestSignature: string | null; // store this as the next cursor
}

/**
 * Fetch wallet transactions incrementally.
 * - Pass `since` (a signature) to only fetch NEW transactions after the last run.
 * - On first run (no `since`), fetches up to `maxPages` pages going back as far as possible.
 * - Returns the newest signature so the caller can store it for the next run.
 */
export async function getWalletTransactions(
  walletAddress: string,
  opts: { since?: string | null; maxPages?: number } = {},
): Promise<FetchResult> {
  if (!HELIUS_API_KEY) throw new Error('HELIUS_API_KEY not set');

  const maxPages = opts.maxPages ?? (opts.since ? 5 : 20); // 20 pages first run (2000 txns), 5 pages incremental
  const allTxns: HeliusTransaction[] = [];
  let before: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ 'api-key': HELIUS_API_KEY, limit: '100' });
    if (before) params.set('before', before);

    let res: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`${HELIUS_BASE}/addresses/${walletAddress}/transactions?${params}`);
      if (res.status !== 429) break;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
    if (!res || !res.ok) throw new Error(`Helius API error: ${res?.status ?? 'no response'}`);

    const txns: HeliusTransaction[] = await res.json();
    if (txns.length === 0) break;

    // Incremental mode: stop when we hit the last-seen signature
    if (opts.since) {
      const cutoffIdx = txns.findIndex(t => t.signature === opts.since);
      if (cutoffIdx !== -1) {
        allTxns.push(...txns.slice(0, cutoffIdx));
        break;
      }
    }

    allTxns.push(...txns);
    before = txns[txns.length - 1].signature;
  }

  return {
    txns: allTxns,
    newestSignature: allTxns.length > 0 ? allTxns[0].signature : (opts.since ?? null),
  };
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
  daysBack: number = 14,
): Promise<TokenTrade[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400;

  const tokenMap = new Map<
    string,
    { buySol: number; sellSol: number; txns: TokenTrade['transactions'] }
  >();

  for (const tx of txns) {
    if (tx.timestamp < cutoff) continue;
    // Accept SWAP + common DEX interaction types that Helius may classify differently
    if (tx.type !== 'SWAP' && tx.type !== 'TRANSFER' && tx.type !== 'UNKNOWN') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    const accountData = tx.accountData || [];

    // Must have non-SOL token transfers to be a trade
    const nonSolTokens = tokenTransfers.filter(t => t.mint !== SOL_MINT);
    if (nonSolTokens.length === 0) continue;

    // For non-SWAP types, require both token AND SOL movement (filters out plain transfers)
    if (tx.type !== 'SWAP') {
      const hasNativeFlow = nativeTransfers.some(n => n.fromUserAccount === walletAddress || n.toUserAccount === walletAddress);
      if (!hasNativeFlow) continue;
    }

    // Compute SOL flow from nativeTransfers (excludes gas) instead of nativeBalanceChange (includes gas)
    let solSpent = 0;
    let solReceived = 0;
    for (const nt of nativeTransfers) {
      const amountSol = nt.amount / 1e9;
      if (nt.fromUserAccount === walletAddress) solSpent += amountSol;
      if (nt.toUserAccount === walletAddress) solReceived += amountSol;
    }
    const netSol = solReceived - solSpent;

    // Fallback to accountData if no native transfers found (some edge cases)
    const effectiveNetSol = (solSpent === 0 && solReceived === 0)
      ? (accountData.find(a => a.account === walletAddress)?.nativeBalanceChange ?? 0) / 1e9
      : netSol;

    for (const token of nonSolTokens) {
      const tokenMint = token.mint;
      const tokenReceived = token.toUserAccount === walletAddress;
      const tokenSent = token.fromUserAccount === walletAddress;
      if (!tokenReceived && !tokenSent) continue;

      if (!tokenMap.has(tokenMint)) {
        tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, txns: [] });
      }
      const entry = tokenMap.get(tokenMint)!;

      if (tokenReceived && effectiveNetSol < -0.0001) {
        const cost = Math.abs(effectiveNetSol);
        entry.buySol += cost;
        entry.txns.push({ type: 'BUY', amountSol: cost, mcap: 0, timestamp: tx.timestamp });
      } else if (tokenSent && effectiveNetSol > 0.0001) {
        entry.sellSol += effectiveNetSol;
        entry.txns.push({ type: 'SELL', amountSol: effectiveNetSol, mcap: 0, timestamp: tx.timestamp });
      }

      break;
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
