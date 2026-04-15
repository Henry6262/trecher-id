/**
 * Seed KolScan KOL traders — 8 traders with verified wallet addresses from HAR capture.
 * Fetches 2 weeks of real transaction history from Helius.
 *
 * Run: DATABASE_URL=... npx tsx scripts/seed-kolscan-kols.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 4 Helius API keys for rotation
const HELIUS_KEYS = [
  process.env.HELIUS_API_KEY || '6f853f8e-1c23-40c7-9a2d-f14977331725',
  '6f853f8e-1c23-40c7-9a2d-f14977331725',
  '8020970f-a413-450c-99bc-e516c06860a5',
  'a70cdbc1-8fd1-4d30-ac3d-762d1f35102f',
];
const HELIUS_BASE = 'https://api.helius.xyz/v0';
const SOL_PRICE = 86; // approximate

// KolScan leaderboard data — traders with verified wallet addresses from HAR
const KOLSCAN_KOLS = [
  { twitter: 'cented_sol',       name: 'Cented',    wallet: 'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o', pnlSol: 154.50, pnlUsd: 13333.3,  buys: 84,  sells: 101 },
  { twitter: 'sheep_sol',        name: 'Sheep',     wallet: '78N177fzNJpp8pG49xDv1efYcTMSzo9tPTKEA9mAVkh2', pnlSol: 139.15, pnlUsd: 12008.6,  buys: 68,  sells: 40  },
  { twitter: 'cupsey_sol',       name: 'Cupsey',    wallet: '2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f', pnlSol: 83.37,  pnlUsd: 7194.4,   buys: 48,  sells: 87  },
  { twitter: 'ogant',            name: 'OGAntD',    wallet: '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP', pnlSol: 77.39,  pnlUsd: 6678.8,   buys: 3,   sells: 1   },
  { twitter: 'dani_sol',         name: 'Dani',      wallet: 'AuPp4YTMTyqxYXQnHc5KUc6pUuCSsHQpBJhgnD45yqrf', pnlSol: 48.85,  pnlUsd: 4215.9,   buys: 13,  sells: 12  },
  { twitter: 'scharo_sol',       name: 'Scharo',    wallet: '4sAUSQFdvWRBxR8UoLBYbw8CcXuwXWxnN8pXa4mtm5nU', pnlSol: 42.94,  pnlUsd: 3706.0,   buys: 42,  sells: 32  },
  { twitter: 'milito_sol',       name: 'milito',    wallet: 'EeXvxkjcGqMDZeTaVeawzxm9mbzZwqDUMmfG3bF7uzumH', pnlSol: 36.26,  pnlUsd: 3129.1,   buys: 25,  sells: 67  },
  { twitter: 'gasp_sol',         name: 'Gasp',      wallet: 'xyzfhxfy8NhfeNG3Um3WaUvFXzNuHkrhrZMD8dsStB6', pnlSol: 34.39,  pnlUsd: 2967.5,   buys: 9,   sells: 12  },
];

interface HeliusTransaction {
  signature: string;
  blockTime: number;
  description: string;
  type: string;
  tokenTransfers?: Array<{ mint: string; fromTokenAccount: string; toTokenAccount: string; fromUserAccount?: string; toUserAccount?: string; tokenAmount: number; tokenStandard: string }>;
  nativeTransfers?: Array<{ account: string; amount: number }>;
  accountData?: Array<{ account: string; nativeBalanceChange: number; tokenBalanceChanges: Array<{ mint: string; tokenAmount: { uiTokenAmount: number } }> }>;
}

async function fetchHeliusTransactions(wallet: string, before?: string, limit = 1000): Promise<{ txns: HeliusTransaction[]; keyIndex: number; status: number }> {
  for (let i = 0; i < HELIUS_KEYS.length; i++) {
    const key = HELIUS_KEYS[i];
    const params = new URLSearchParams({ 'api-key': key, limit: String(limit) });
    if (before) params.set('before', before);

    try {
      const res = await fetch(`${HELIUS_BASE}/addresses/${wallet}/transactions?${params}`);
      if (!res.ok) {
        if (res.status === 429) {
          console.log(`    Key ${i+1} rate-limited (429), rotating...`);
          continue;
        }
        return { txns: [], keyIndex: i, status: res.status };
      }
      const data = await res.json();
      return { txns: Array.isArray(data) ? data : [], keyIndex: i, status: 200 };
    } catch {
      continue;
    }
  }
  return { txns: [], keyIndex: -1, status: 0 };
}

async function main() {
  let created = 0;
  let updated = 0;
  let totalTrades = 0;

  for (const kol of KOLSCAN_KOLS) {
    const username = kol.twitter.toLowerCase();
    const winRate = kol.buys + kol.sells > 0 ? (kol.sells / (kol.buys + kol.sells)) * 100 : 0;

    console.log(`\n=== ${kol.name} (@${kol.twitter}) ===`);

    // Create or update user
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        displayName: kol.name,
        bio: 'Solana memecoin trader · KolScan verified',
      },
      create: {
        username,
        displayName: kol.name,
        bio: 'Solana memecoin trader · KolScan verified',
        avatarUrl: `https://unavatar.io/x/${kol.twitter}`,
        twitterId: `kolscan_${username}`,
        privyUserId: `kolscan_${username}`,
      },
    });

    // Create or update wallet
    const wallet = await prisma.wallet.upsert({
      where: { userId_address: { userId: user.id, address: kol.wallet } },
      update: {
        totalPnlUsd: kol.pnlUsd,
        winRate,
        totalTrades: kol.buys + kol.sells,
        isMain: true,
        verified: true,
        statsUpdatedAt: new Date(),
      },
      create: {
        userId: user.id,
        address: kol.wallet,
        chain: 'solana',
        verified: true,
        isMain: true,
        totalPnlUsd: kol.pnlUsd,
        winRate,
        totalTrades: kol.buys + kol.sells,
        statsUpdatedAt: new Date(),
      },
    });

    // Update or create ranking
    await prisma.userRanking.upsert({
      where: { userId_period: { userId: user.id, period: 'all' } },
      update: { pnlUsd: kol.pnlUsd, pnlSol: kol.pnlSol, winRate, trades: kol.buys + kol.sells },
      create: { userId: user.id, period: 'all', pnlUsd: kol.pnlUsd, pnlSol: kol.pnlSol, winRate, trades: kol.buys + kol.sells },
    });

    console.log(`  ✓ User/wallet created: ${kol.name} — $${kol.pnlUsd.toFixed(0)} PnL`);

    // Fetch real transactions from Helius (last 2 weeks)
    console.log(`  Fetching transactions from Helius (4-key rotation)...`);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoTimestamp = Math.floor(twoWeeksAgo.getTime() / 1000);

    const allTxns: HeliusTransaction[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 30; page++) {
      const result = await fetchHeliusTransactions(kol.wallet, cursor, 1000);

      if (result.txns.length > 0) {
        allTxns.push(...result.txns);

        // Check if we've reached transactions older than 2 weeks
        const lastTxn = result.txns[result.txns.length - 1];
        if (lastTxn.blockTime && lastTxn.blockTime < twoWeeksAgoTimestamp) break;

        cursor = lastTxn.signature;

        if (result.txns.length < 1000) break;
      } else {
        if (result.status === 400) {
          console.log(`  Wallet ${kol.wallet.slice(0,8)}... returned 400, may not exist on Helius`);
          break;
        }
        break;
      }

      // Wait between pages to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    // Filter to last 2 weeks
    const recentTxns = allTxns.filter(tx => tx.blockTime && tx.blockTime >= twoWeeksAgoTimestamp);
    console.log(`  Fetched ${allTxns.length} total, ${recentTxns.length} in last 2 weeks`);

    // Parse and insert trade events
    let eventCount = 0;
    for (const tx of recentTxns) {
      const tokenTransfers = tx.tokenTransfers || [];
      if (tokenTransfers.length === 0) continue;

      for (const transfer of tokenTransfers) {
        // Only count transfers where this wallet was involved
        const isInvolved =
          transfer.fromUserAccount === kol.wallet ||
          transfer.toUserAccount === kol.wallet;

        if (!isInvolved) continue;

        const isBuy = transfer.toUserAccount === kol.wallet;
        const amountSol = Math.abs(
          (tx.nativeTransfers || []).reduce((sum, n) => {
            if (n.account === kol.wallet) return sum + n.amount / 1e9;
            return sum;
          }, 0)
        );

        // Approximate token symbol from mint (we'll use unknown if we can't resolve)
        const tokenSymbol = 'UNKNOWN';
        const tokenName = `Token ${transfer.mint.slice(0, 8)}`;

        try {
          await prisma.walletTradeEvent.create({
            data: {
              walletId: wallet.id,
              signature: tx.signature,
              tokenMint: transfer.mint,
              tokenSymbol,
              tokenName,
              type: isBuy ? 'buy' : 'sell',
              amountSol: amountSol || (transfer.tokenAmount / 100), // fallback estimate
              timestamp: new Date(tx.blockTime * 1000),
            },
          });
          eventCount++;
        } catch (e: any) {
          // Skip duplicates (unique constraint)
          if (!e.code || e.code !== 'P2002') {
            console.error(`    Insert error: ${e.message}`);
          }
        }
      }
    }

    console.log(`  ✓ Inserted ${eventCount} trade events`);
    totalTrades += eventCount;

    // Create x.com link
    await prisma.link.upsert({
      where: { id: `${user.id}_x` },
      update: {},
      create: {
        id: `${user.id}_x`,
        userId: user.id,
        title: `@${kol.twitter}`,
        url: `https://x.com/${kol.twitter}`,
        icon: 'x',
        order: 0,
      },
    });

    created++;
    await new Promise(r => setTimeout(r, 500)); // rate limit between traders
  }

  console.log(`\n=== DONE: ${created} traders seeded, ${totalTrades} trade events inserted ===`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
