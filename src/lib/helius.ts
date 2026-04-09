import { redis } from './redis';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_BASE = 'https://api.helius.xyz/v0';
const TOKEN_METADATA_TTL_SECONDS = 60 * 60 * 24;
const BUILTIN_HELIUS_FALLBACK_KEYS = [
  '6f853f8e-1c23-40c7-9a2d-f14977331725',
  '8020970f-a413-450c-99bc-e516c06860a5',
  'a70cdbc1-8fd1-4d30-ac3d-762d1f35102f',
];
const HELIUS_API_KEYS = Array.from(
  new Set(
    [HELIUS_API_KEY, ...BUILTIN_HELIUS_FALLBACK_KEYS].filter(
      (apiKey): apiKey is string => Boolean(apiKey),
    ),
  ),
);

// ─── Token Metadata via Helius DAS ────────────────────────────

interface TokenMeta {
  symbol: string;
  name: string;
  image: string | null;
}

interface HeliusJsonRpcError {
  code?: number;
  message?: string;
}

interface HeliusJsonRpcResponse<T> {
  result?: T;
  error?: HeliusJsonRpcError;
}

const metadataCache = new Map<string, TokenMeta>();

function getHeliusRpcUrl(apiKey: string): string {
  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

function isHeliusQuotaError(status: number, payload: unknown): boolean {
  if (status === 429) return true;
  if (!payload || typeof payload !== 'object') return false;

  const error = (payload as { error?: HeliusJsonRpcError }).error;
  const message = error?.message?.toLowerCase() ?? '';
  return error?.code === -32429 || message.includes('max usage reached') || message.includes('rate limit');
}

async function fetchHeliusJsonWithKeyRotation<T>(
  requestFactory: (apiKey: string) => { url: string; init?: RequestInit },
): Promise<T> {
  if (HELIUS_API_KEYS.length === 0) {
    throw new Error('HELIUS_API_KEY not set');
  }

  let lastError: string | null = null;

  for (const apiKey of HELIUS_API_KEYS) {
    const { url, init } = requestFactory(apiKey);

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, init);
      let payload: unknown = null;

      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (isHeliusQuotaError(res.status, payload)) {
        lastError =
          (payload as { error?: HeliusJsonRpcError } | null)?.error?.message ??
          `Helius quota exhausted for key ${apiKey.slice(0, 8)}...`;
        break;
      }

      if (!res.ok) {
        lastError = `Helius API error: ${res.status}`;
        break;
      }

      return payload as T;
    }
  }

  throw new Error(lastError ?? 'Helius API error: all keys exhausted');
}

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
      const data = await fetchHeliusJsonWithKeyRotation<HeliusJsonRpcResponse<unknown[]>>(
        (apiKey) => ({
          url: getHeliusRpcUrl(apiKey),
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 'web3me',
              method: 'getAssetBatch',
              params: { ids: uncached },
            }),
          },
        }),
      );

      const assets = data.result || [];
      const fetchedEntries: [string, TokenMeta][] = [];
      for (const asset of assets) {
        if (asset && typeof asset === 'object' && 'id' in asset) {
          const assetId = String(asset.id);
          const metadata = {
            symbol:
              (asset as { content?: { metadata?: { symbol?: string } } }).content?.metadata?.symbol ||
              assetId.slice(0, 6),
            name: (asset as { content?: { metadata?: { name?: string } } }).content?.metadata?.name || '',
            image:
              (asset as { content?: { links?: { image?: string | null }; files?: Array<{ uri?: string | null }> } })
                .content?.links?.image ||
              (asset as { content?: { files?: Array<{ uri?: string | null }> } }).content?.files?.[0]?.uri ||
              null,
          };
          metadataCache.set(assetId, metadata);
          fetchedEntries.push([assetId, metadata]);
        }
      }
      await persistTokenMetadataToRedis(fetchedEntries);
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
  oldestFetchedSignature: string | null;
  pagesFetched: number;
  previousCursorFound: boolean | null;
  reachedHistoryEnd: boolean;
  pageLimitReached: boolean;
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
  if (HELIUS_API_KEYS.length === 0) throw new Error('HELIUS_API_KEY not set');

  const maxPages = opts.maxPages ?? (opts.since ? 5 : 20); // 20 pages first run (2000 txns), 5 pages incremental
  const allTxns: HeliusTransaction[] = [];
  let before: string | undefined;
  let pagesFetched = 0;
  let previousCursorFound = opts.since ? false : null;
  let reachedHistoryEnd = false;
  let pageLimitReached = false;

  for (let page = 0; page < maxPages; page++) {
    const txns = await fetchHeliusJsonWithKeyRotation<HeliusTransaction[]>((apiKey) => {
      const params = new URLSearchParams({ 'api-key': apiKey, limit: '100' });
      if (before) params.set('before', before);
      return {
        url: `${HELIUS_BASE}/addresses/${walletAddress}/transactions?${params}`,
      };
    });

    if (txns.length === 0) {
      reachedHistoryEnd = true;
      break;
    }

    pagesFetched += 1;

    // Incremental mode: stop when we hit the last-seen signature
    if (opts.since) {
      const cutoffIdx = txns.findIndex(t => t.signature === opts.since);
      if (cutoffIdx !== -1) {
        previousCursorFound = true;
        allTxns.push(...txns.slice(0, cutoffIdx));
        break;
      }
    }

    allTxns.push(...txns);
    before = txns[txns.length - 1].signature;
    if (txns.length < 100) {
      reachedHistoryEnd = true;
      break;
    }

    if (page === maxPages - 1) {
      pageLimitReached = true;
    }
  }

  return {
    txns: allTxns,
    newestSignature: allTxns.length > 0 ? allTxns[0].signature : (opts.since ?? null),
    oldestFetchedSignature: allTxns.length > 0 ? allTxns[allTxns.length - 1].signature : null,
    pagesFetched,
    previousCursorFound,
    reachedHistoryEnd,
    pageLimitReached,
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
