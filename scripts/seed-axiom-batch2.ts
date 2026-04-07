/**
 * Seed Axiom Vision batch 2 — 14 new traders.
 * Run: DATABASE_URL=... npx tsx scripts/seed-axiom-batch2.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SOL_PRICE = 82;

// wins = >500% + 200%~500% + 0%~200%, losses = 0%~-50% + <-50%
const BATCH2 = [
  { name: 'Classic',          username: 'classic_axiom',    wallet: 'DsqRyTUh1R37asYcVf1KdX4CNnz5DKEFmnXvgT4NfTPE', pnlUsd: 530000,  txns: 28548, wins: 5609,  losses: 5668  },
  { name: '4ZdC Trader',      username: '4zdc_trader',      wallet: '4ZdCpHJrSn4E9GmfP8jjfsAExHGja2TEn4JmXfEeNtyT', pnlUsd: 4100,    txns: 635,   wins: 64,    losses: 132   },
  { name: 'Solstice',         username: 'solstice_axiom',   wallet: 'GrD2umbfEBjQKFPDQvmmYNQ5eyRL9SAdWJj9FFMyeaDN', pnlUsd: 0,       txns: 2094,  wins: 455,   losses: 53    }, // negative PnL -$83.2K but realized -$91.3K, skip PnL
  { name: '2Fbb Trader',      username: '2fbb_trader',      wallet: '2FbbtmK9MN3Zxkz3AnqoAGnRQNy2SVRaAazq2sFSbftM', pnlUsd: 395000,  txns: 28726, wins: 5244,  losses: 3840  },
  { name: 'Beaver',           username: 'beaver_axiom',     wallet: 'GM7Hrz2bDq33ezMtL6KGidSWZXMWgZ6qBuugkb5H8NvN', pnlUsd: 291000,  txns: 20070, wins: 2739,  losses: 3644  },
  { name: 'Insentos',         username: 'insentos_axiom',   wallet: '7SDs3PjT2mswKQ7Zo4FTucn9gJdtuW4jaacPA65BseHS', pnlUsd: 2910000, txns: 8914,  wins: 2108,  losses: 1188  },
  { name: 'Kaizen',           username: 'kaizen_axiom',     wallet: 'HUw7KmaEePsS21PcSRAMscoBhGp7cekQ6TLkT6XrBi1s', pnlUsd: 11800,   txns: 617,   wins: 70,    losses: 119   },
  { name: 'Old',              username: 'old_axiom',        wallet: 'CA4keXLtGJWBcsWivjtMFBghQ8pFsGRWFxLrRCtirzu5', pnlUsd: 364000,  txns: 4361,  wins: 515,   losses: 387   },
  { name: 'Evening',          username: 'evening_axiom',    wallet: 'E7gozEiAPNhpJsdS52amhhN2XCAqLZa7WPrhyR6C8o4S', pnlUsd: 78100,   txns: 2171,  wins: 281,   losses: 268   },
  { name: 'Jalen',            username: 'jalen_axiom',      wallet: 'F72vY99ihQsYwqEDCfz7igKXA5me6vN2zqVsVUTpw6qL', pnlUsd: 1250000, txns: 16879, wins: 3686,  losses: 3081  },
  { name: 'ky',               username: 'ky_axiom',         wallet: 'iBd9DeBTkKL6sffYRDHQvshAke5up253kq1HLNiG4D9',  pnlUsd: 381000,  txns: 24054, wins: 2230,  losses: 7036  },
  { name: 'Lyxe',             username: 'lyxe_axiom',       wallet: 'HLv6yCEpgjQV9PcKsvJpem8ESyULTyh9HjHn9CtqSek1', pnlUsd: 33900,   txns: 2122,  wins: 328,   losses: 295   },
  { name: 'Spike',            username: 'spike_axiom',      wallet: 'FhsSfTSHok3ryVfyuLSD1t9frc4c1ymyCr3S11Ci718z', pnlUsd: 169000,  txns: 19922, wins: 4141,  losses: 3334  },
];

const PERIODS = ['1d', '3d', '7d', 'all'] as const;
const PERIOD_SCALE: Record<string, number> = { '1d': 0.015, '3d': 0.07, '7d': 0.22, 'all': 1.0 };

// Existing wallets to check dupes
const EXISTING_CHECK = [
  'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm', // KOLScan Prime — already in DB
];

async function main() {
  // Check DB for dupes
  const existingWallets = await prisma.wallet.findMany({ select: { address: true } });
  const existingSet = new Set(existingWallets.map(w => w.address));

  let seeded = 0;
  let skipped = 0;

  for (const t of BATCH2) {
    if (existingSet.has(t.wallet)) {
      console.log(`  ⊘ SKIP ${t.name.padEnd(18)} — wallet already in DB`);
      skipped++;
      continue;
    }

    // Skip Solstice (negative PnL)
    if (t.pnlUsd === 0 && t.name === 'Solstice') {
      console.log(`  ⊘ SKIP ${t.name.padEnd(18)} — negative PnL (-$83K)`);
      skipped++;
      continue;
    }

    const pnlSol = Math.round(t.pnlUsd / SOL_PRICE);
    const totalTrades = t.wins + t.losses;
    const winRate = totalTrades > 0 ? (t.wins / totalTrades) * 100 : 0;

    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: { displayName: t.name },
      create: {
        username: t.username, displayName: t.name, bio: 'Solana trader',
        avatarUrl: `https://unavatar.io/twitter/${t.username}`,
        twitterId: `precreated_${t.username}`, privyUserId: `precreated_${t.username}`,
      },
    });

    await prisma.wallet.upsert({
      where: { userId_address: { userId: user.id, address: t.wallet } },
      update: { totalPnlUsd: t.pnlUsd, winRate, totalTrades, isMain: true, verified: true, statsUpdatedAt: new Date() },
      create: {
        userId: user.id, address: t.wallet, chain: 'solana',
        verified: true, isMain: true, totalPnlUsd: t.pnlUsd, winRate, totalTrades, statsUpdatedAt: new Date(),
      },
    });

    await prisma.link.upsert({
      where: { id: `${user.id}_twitter` },
      update: {},
      create: { id: `${user.id}_twitter`, userId: user.id, title: `@${t.username}`, url: `https://x.com/${t.username}`, icon: 'x', order: 0 },
    });

    for (const period of PERIODS) {
      const scale = PERIOD_SCALE[period];
      const jitter = 0.88 + Math.random() * 0.24;
      await prisma.userRanking.upsert({
        where: { userId_period: { userId: user.id, period } },
        update: { pnlUsd: Math.round(t.pnlUsd * scale * jitter), pnlSol: Math.round(pnlSol * scale * jitter * 10) / 10, winRate, trades: Math.max(1, Math.round(totalTrades * scale)) },
        create: { userId: user.id, period, pnlUsd: Math.round(t.pnlUsd * scale * jitter), pnlSol: Math.round(pnlSol * scale * jitter * 10) / 10, winRate, trades: Math.max(1, Math.round(totalTrades * scale)) },
      });
    }

    seeded++;
    console.log(`  ✓ NEW  ${t.name.padEnd(18)} $${(t.pnlUsd / 1000).toFixed(0)}K PnL | ${t.wallet.slice(0, 8)}...`);
  }

  const userCount = await prisma.user.count();
  console.log(`\nDone: ${seeded} new, ${skipped} skipped. DB: ${userCount} users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
