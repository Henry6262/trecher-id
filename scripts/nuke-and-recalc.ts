/**
 * NUKE & RECALC — Delete all fake data, rebuild from Helius
 *
 * Usage: npx tsx scripts/nuke-and-recalc.ts [--wallet=address] [--skip-nuke]
 *
 * This script:
 * 1. Deletes ALL WalletTrade, UserRanking, PinnedTrade, TokenDeployment records (unless --skip-nuke)
 * 2. Resets all wallet cursors (lastSignature, lastFetchedAt)
 * 3. Resets all wallet stats (totalPnlUsd, winRate, totalTrades)
 * 4. For each wallet, fetches real transactions from Helius
 * 5. Creates real WalletTrade records from on-chain swaps
 * 6. Rebuilds UserRanking for all periods from real data
 * 7. Detects real token deployments per user
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Round-robin Helius API keys to avoid rate limits
const HELIUS_KEYS = [
  process.env.HELIUS_API_KEY,
  '6f853f8e-1c23-40c7-9a2d-f14977331725',
  '8020970f-a413-450c-99bc-e516c06860a5',
  'a70cdbc1-8fd1-4d30-ac3d-762d1f35102f',
].filter(Boolean) as string[];

if (HELIUS_KEYS.length === 0) { console.error('❌ No HELIUS_API_KEY found'); process.exit(1); }
console.log(`🔑 Using ${HELIUS_KEYS.length} Helius API keys for rotation`);

let keyIndex = 0;
function nextKey(): string {
  const key = HELIUS_KEYS[keyIndex % HELIUS_KEYS.length];
  keyIndex++;
  return key;
}

const HELIUS_BASE = `https://api.helius.xyz/v0`;
function heliusRpc(key: string) { return `https://mainnet.helius-rpc.com/?api-key=${key}`; }
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

interface HeliusTokenTransfer {
  mint: string;
  toUserAccount?: string | null;
  fromUserAccount?: string | null;
}

interface HeliusNativeTransfer {
  amount: number;
  fromUserAccount?: string | null;
  toUserAccount?: string | null;
}

interface HeliusAccountData {
  account?: string | null;
  nativeBalanceChange?: number | null;
}

interface HeliusTransaction {
  signature?: string | null;
  type?: string | null;
  timestamp: number;
  description?: string | null;
  source?: string | null;
  tokenTransfers?: HeliusTokenTransfer[] | null;
  nativeTransfers?: HeliusNativeTransfer[] | null;
  accountData?: HeliusAccountData[] | null;
}

interface HeliusAsset {
  id?: string;
  content?: {
    metadata?: {
      symbol?: string | null;
      name?: string | null;
    } | null;
    links?: {
      image?: string | null;
    } | null;
    files?: Array<{ uri?: string | null }> | null;
  } | null;
}

interface HeliusAssetBatchResponse {
  result?: HeliusAsset[] | null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Helius fetching ────────────────────────────────────────

async function fetchWithRetry(url: string, opts?: RequestInit, retries = 5): Promise<Response> {
  let lastStatus = 0;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    // Inject current rotating key into URL if it's a Helius URL
    let targetUrl = url;
    if (url.includes('api.helius.xyz') || url.includes('mainnet.helius-rpc.com')) {
      const currentKey = nextKey();
      const urlObj = new URL(url);
      urlObj.searchParams.set('api-key', currentKey);
      targetUrl = urlObj.toString();
    }

    const res = await fetch(targetUrl, opts);
    lastStatus = res.status;

    if (res.status === 429) {
      const wait = 2000 * (attempt + 1);
      process.stdout.write(`⏳${Math.round(wait/1000)}s (429) `);
      await sleep(wait);
      continue;
    }
    
    if (res.status === 400) {
       // Often means the 'before' cursor is invalid or wallet doesn't exist anymore
       return res;
    }

    if (!res.ok) {
      const wait = 1000 * (attempt + 1);
      process.stdout.write(`⏳${Math.round(wait/1000)}s (${res.status}) `);
      await sleep(wait);
      continue;
    }

    return res;
  }
  throw new Error(`Helius API failed after ${retries} retries (last status: ${lastStatus})`);
}

async function getWalletTransactions(walletAddress: string, maxPages = 30) {
  const allTxns: HeliusTransaction[] = [];
  let before: string | null | undefined;

  for (let page = 0; page < maxPages; page++) {
    // API key will be injected by fetchWithRetry
    let url = `${HELIUS_BASE}/addresses/${walletAddress}/transactions?limit=100`;
    if (before) url += `&before=${before}`;

    const res = await fetchWithRetry(url);
    if (!res.ok) break;

    const txns = await res.json() as HeliusTransaction[];
    if (!Array.isArray(txns) || txns.length === 0) break;

    allTxns.push(...txns);
    before = txns[txns.length - 1].signature;

    if (txns.length < 100) break;
    // Lower sleep since we rotate keys
    await sleep(500);
  }

  const newestSig = allTxns[0]?.signature || null;
  return { txns: allTxns, newestSignature: newestSig };
}

// ─── Swap parsing ───────────────────────────────────────────

function parseSwaps(txns: HeliusTransaction[], walletAddress: string) {
  const tokenMap = new Map<string, {
    buySol: number; sellSol: number; count: number;
    firstAt: number; lastAt: number;
  }>();

  for (const tx of txns) {
    if (tx.type !== 'SWAP' && tx.type !== 'TRANSFER' && tx.type !== 'UNKNOWN') continue;

    const tokenTransfers = tx.tokenTransfers ?? [];
    const nativeTransfers = tx.nativeTransfers ?? [];
    const accountData = tx.accountData ?? [];

    const nonSolTokens = tokenTransfers.filter((t) => t.mint !== SOL_MINT);
    if (nonSolTokens.length === 0) continue;

    if (tx.type !== 'SWAP') {
      const hasNativeFlow = nativeTransfers.some((n) => n.fromUserAccount === walletAddress || n.toUserAccount === walletAddress);
      if (!hasNativeFlow) continue;
    }

    let solSpent = 0;
    let solReceived = 0;
    for (const nt of nativeTransfers) {
      const amountSol = nt.amount / 1e9;
      if (nt.fromUserAccount === walletAddress) solSpent += amountSol;
      if (nt.toUserAccount === walletAddress) solReceived += amountSol;
    }
    const netSol = solReceived - solSpent;
    const effectiveNetSol = (solSpent === 0 && solReceived === 0)
      ? (accountData.find((a) => a.account === walletAddress)?.nativeBalanceChange ?? 0) / 1e9
      : netSol;

    for (const token of nonSolTokens) {
      const tokenMint = token.mint;
      const tokenReceived = token.toUserAccount === walletAddress;
      const tokenSent = token.fromUserAccount === walletAddress;
      if (!tokenReceived && !tokenSent) continue;

      if (!tokenMap.has(tokenMint)) {
        tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, count: 0, firstAt: tx.timestamp, lastAt: tx.timestamp });
      }
      const entry = tokenMap.get(tokenMint)!;
      entry.firstAt = Math.min(entry.firstAt, tx.timestamp);
      entry.lastAt = Math.max(entry.lastAt, tx.timestamp);
      entry.count++;

      if (tokenReceived && effectiveNetSol < -0.0001) {
        entry.buySol += Math.abs(effectiveNetSol);
      } else if (tokenSent && effectiveNetSol > 0.0001) {
        entry.sellSol += effectiveNetSol;
      }

      break;
    }
  }

  return tokenMap;
}

// ─── Token metadata ─────────────────────────────────────────

async function getTokenMetadata(mints: string[], apiKey: string): Promise<Map<string, { symbol: string; name: string; image: string | null }>> {
  const map = new Map();
  if (mints.length === 0) return map;

  try {
    const res = await fetchWithRetry(heliusRpc(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'batch-meta',
        method: 'getAssetBatch',
        params: { ids: mints.slice(0, 100) },
      }),
    });

    if (res.ok) {
      const data = await res.json() as HeliusAssetBatchResponse;
      for (const asset of data.result || []) {
        if (asset?.id) {
          map.set(asset.id, {
            symbol: asset.content?.metadata?.symbol || asset.id.slice(0, 6),
            name: asset.content?.metadata?.name || null,
            image: asset.content?.links?.image || asset.content?.files?.[0]?.uri || null,
          });
        }
      }
    }
  } catch {
    console.log('    ⚠️ Token metadata fetch failed, using mint prefixes');
  }

  return map;
}

// ─── Deployment detection ───────────────────────────────────

function detectDeployments(txns: HeliusTransaction[], walletAddress: string) {
  const deployMints: { mint: string; timestamp: number; platform: string }[] = [];

  for (const tx of txns) {
    const desc = (tx.description || '').toLowerCase();
    const source = (tx.source || '').toLowerCase();
    const isPumpFun = desc.includes('pump') || source.includes('pump') || desc.includes(PUMP_FUN_PROGRAM);

    if (tx.type === 'CREATE' && tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      const mint = tx.tokenTransfers[0].mint;
      if (mint) {
        deployMints.push({ mint, timestamp: tx.timestamp, platform: isPumpFun ? 'pump.fun' : 'unknown' });
        continue;
      }
    }

    const isCreateAction = desc.includes('create') || desc.includes('launch') || desc.includes('deploy') || desc.includes('initialized');
    if (isCreateAction && tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      const isFeePayer = tx.nativeTransfers?.some((nt) => nt.fromUserAccount === walletAddress && nt.amount > 0) ?? false;
      if (isFeePayer) {
        const nonSol = tx.tokenTransfers?.find((t) => t.mint !== SOL_MINT);
        if (nonSol) {
          deployMints.push({ mint: nonSol.mint, timestamp: tx.timestamp, platform: isPumpFun ? 'pump.fun' : 'raydium' });
        }
      }
    }
  }

  // Dedupe by mint
  const unique = new Map<string, { timestamp: number; platform: string }>();
  for (const d of deployMints) {
    if (!unique.has(d.mint)) unique.set(d.mint, { timestamp: d.timestamp, platform: d.platform });
  }
  return unique;
}

// ─── SOL price ──────────────────────────────────────────────

async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await res.json();
    return data.solana?.usd ?? 130;
  } catch {
    return 130;
  }
}

// ─── Main ───────────────────────────────────────────────────

const TARGET_WALLET = process.argv.find(a => a.startsWith('--wallet='))?.split('=')[1];
const SKIP_NUKE = process.argv.includes('--skip-nuke');

async function main() {
  console.log('\n🔥 NUKE & RECALC — Replacing all fake data with real Helius data\n');

  if (TARGET_WALLET) {
    console.log(`🎯 Targeting single wallet: ${TARGET_WALLET}`);
    // If targeting single wallet, we only delete data for that wallet
    const wallet = await prisma.wallet.findFirst({ where: { address: TARGET_WALLET } });
    if (wallet) {
      console.log(`🧹 Deleting existing data for wallet ${wallet.address.slice(0, 8)}...`);
      await prisma.walletTrade.deleteMany({ where: { walletId: wallet.id } });
      // We don't nuke rankings or deployments for single wallet since they might overlap
    }
  } else if (!SKIP_NUKE) {
    // Step 1: Nuke all fake data
    console.log('💣 Step 1: Deleting all trade data...');
    const deletedTrades = await prisma.walletTrade.deleteMany({});
    console.log(`   Deleted ${deletedTrades.count} WalletTrade records`);

    const deletedRankings = await prisma.userRanking.deleteMany({});
    console.log(`   Deleted ${deletedRankings.count} UserRanking records`);

    const deletedPinned = await prisma.pinnedTrade.deleteMany({});
    console.log(`   Deleted ${deletedPinned.count} PinnedTrade records`);

    const deletedDeployments = await prisma.tokenDeployment.deleteMany({});
    console.log(`   Deleted ${deletedDeployments.count} TokenDeployment records`);

    // Step 2: Reset all wallet cursors and stats
    console.log('\n🔄 Step 2: Resetting wallet cursors and stats...');
    await prisma.wallet.updateMany({
      data: {
        lastSignature: null,
        lastFetchedAt: null,
        totalPnlUsd: 0,
        winRate: 0,
        totalTrades: 0,
      },
    });
    const walletCount = await prisma.wallet.count();
    console.log(`   Reset ${walletCount} wallets`);
  }

  // Step 3: Get SOL price
  const solPrice = await getSolPrice();
  console.log(`\n💰 SOL price: $${solPrice}\n`);

  // Step 4: Fetch all wallets with user info
  const wallets = await prisma.wallet.findMany({
    where: TARGET_WALLET ? { address: TARGET_WALLET } : {},
    include: { user: true },
    orderBy: { id: 'asc' },
  });

  console.log(`📡 Step 3: Processing ${wallets.length} wallets from Helius...\n`);

  let processed = 0;
  let errors = 0;
  let totalTradesCreated = 0;
  let totalDeploymentsFound = 0;

  for (const wallet of wallets) {
    const idx = processed + 1;
    process.stdout.write(`  [${idx}/${wallets.length}] ${wallet.address.slice(0, 8)}... (@${wallet.user.username}) `);

    try {
      // Fetch transactions from Helius
      const { txns, newestSignature } = await getWalletTransactions(wallet.address, 5);
      process.stdout.write(`${txns.length} txns `);

      // Parse swaps
      const swapMap = parseSwaps(txns, wallet.address);

      // Detect deployments from same txns
      const deployMap = detectDeployments(txns, wallet.address);

      // Get token metadata for swaps + deployments
      const allMints = [...swapMap.keys(), ...deployMap.keys()];
      const metadata = allMints.length > 0 ? await getTokenMetadata([...new Set(allMints)], nextKey()) : new Map();

      // Write WalletTrade records
      for (const [tokenMint, data] of swapMap) {
        const meta = metadata.get(tokenMint);
        await prisma.walletTrade.create({
          data: {
            walletId: wallet.id,
            tokenMint,
            tokenSymbol: meta?.symbol || tokenMint.slice(0, 6),
            buySol: data.buySol,
            sellSol: data.sellSol,
            pnlSol: data.sellSol - data.buySol,
            tradeCount: data.count,
            firstTradeAt: new Date(data.firstAt * 1000),
            lastTradeAt: new Date(data.lastAt * 1000),
          },
        });
      }
      totalTradesCreated += swapMap.size;

      // Write TokenDeployment records
      for (const [mint, info] of deployMap) {
        const meta = metadata.get(mint);
        await prisma.tokenDeployment.upsert({
          where: { tokenMint: mint },
          create: {
            userId: wallet.userId,
            walletAddress: wallet.address,
            tokenMint: mint,
            tokenSymbol: meta?.symbol || mint.slice(0, 6),
            tokenName: meta?.name || null,
            tokenImageUrl: meta?.image || null,
            platform: info.platform,
            status: 'bonding',
            deployedAt: new Date(info.timestamp * 1000),
            updatedAt: new Date(),
          },
          update: {
            tokenSymbol: meta?.symbol || mint.slice(0, 6),
            tokenName: meta?.name || null,
            tokenImageUrl: meta?.image || null,
            updatedAt: new Date(),
          },
        });
      }
      totalDeploymentsFound += deployMap.size;

      // Update wallet cursor
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { lastSignature: newestSignature, lastFetchedAt: new Date() },
      });

      process.stdout.write(`→ ${swapMap.size} trades, ${deployMap.size} deploys ✅\n`);
      processed++;

      // Delay between wallets — respect rate limits
      await sleep(2000);
    } catch (err) {
      process.stdout.write(`❌ ${String(err).slice(0, 60)}\n`);
      errors++;
      await sleep(3000);
    }
  }

  // Step 5: Rebuild rankings for all users
  console.log(`\n📊 Step 4: Rebuilding rankings for all users...`);

  const users = await prisma.user.findMany({
    where: TARGET_WALLET ? { wallets: { some: { address: TARGET_WALLET } } } : {},
    include: { wallets: true },
  });

  let rankingsCreated = 0;

  for (const user of users) {
    const walletIds = user.wallets.map(w => w.id);
    if (walletIds.length === 0) continue;

    const allTrades = await prisma.walletTrade.findMany({
      where: { walletId: { in: walletIds } },
    });

    if (allTrades.length === 0) continue;

    const now = Date.now();
    const periods = [
      { key: '1d', ms: 1 * 86400 * 1000 },
      { key: '3d', ms: 3 * 86400 * 1000 },
      { key: '7d', ms: 7 * 86400 * 1000 },
      { key: '14d', ms: 14 * 86400 * 1000 },
    ] as const;

    for (const period of periods) {
      const cutoff = new Date(now - period.ms);
      const periodTrades = allTrades.filter(t => t.lastTradeAt >= cutoff);
      const pnlSol = periodTrades.reduce((s, t) => s + t.pnlSol, 0);
      const totalTrades = periodTrades.reduce((s, t) => s + t.tradeCount, 0);
      const wins = periodTrades.reduce((s, t) => s + (t.pnlSol > 0 ? t.tradeCount : 0), 0);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      await prisma.userRanking.upsert({
        where: { userId_period: { userId: user.id, period: period.key } },
        create: { userId: user.id, period: period.key, pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades },
        update: { pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades, updatedAt: new Date() },
      });
      rankingsCreated++;
    }

    // All-time
    const allPnlSol = allTrades.reduce((s, t) => s + t.pnlSol, 0);
    const allTradeCount = allTrades.reduce((s, t) => s + t.tradeCount, 0);
    const allWins = allTrades.reduce((s, t) => s + (t.pnlSol > 0 ? t.tradeCount : 0), 0);
    const allWR = allTradeCount > 0 ? (allWins / allTradeCount) * 100 : 0;

    await prisma.userRanking.upsert({
      where: { userId_period: { userId: user.id, period: 'all' } },
      create: { userId: user.id, period: 'all', pnlSol: allPnlSol, pnlUsd: allPnlSol * solPrice, winRate: allWR, trades: allTradeCount },
      update: { pnlSol: allPnlSol, pnlUsd: allPnlSol * solPrice, winRate: allWR, trades: allTradeCount, updatedAt: new Date() },
    });
    rankingsCreated++;

    // Update wallet-level stats too
    for (const w of user.wallets) {
      const wTrades = allTrades.filter(t => t.walletId === w.id);
      const wPnl = wTrades.reduce((s, t) => s + t.pnlSol, 0);
      const wCount = wTrades.reduce((s, t) => s + t.tradeCount, 0);
      const wWins = wTrades.reduce((s, t) => s + (t.pnlSol > 0 ? t.tradeCount : 0), 0);
      const wWR = wCount > 0 ? (wWins / wCount) * 100 : 0;

      await prisma.wallet.update({
        where: { id: w.id },
        data: { totalPnlUsd: wPnl * solPrice, winRate: wWR, totalTrades: wCount },
      });
    }
  }

  // Done
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ DONE`);
  console.log(`   Wallets processed: ${processed} (${errors} errors)`);
  console.log(`   WalletTrade records created: ${totalTradesCreated}`);
  console.log(`   TokenDeployments found: ${totalDeploymentsFound}`);
  console.log(`   UserRankings created: ${rankingsCreated}`);
  console.log(`   SOL price used: $${solPrice}`);
  console.log(`${'─'.repeat(50)}\n`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  pool.end();
  process.exit(1);
});
