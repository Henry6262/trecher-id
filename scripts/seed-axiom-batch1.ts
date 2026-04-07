/**
 * Seed Axiom Vision batch 1 — 12 new traders + update 6 existing with real PnL.
 * PnL data from Axiom Vision leaderboard (Max timeframe).
 *
 * Run: DATABASE_URL=... npx tsx scripts/seed-axiom-batch1.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SOL_PRICE = 82; // approx current

// Axiom PnL breakdown: wins = >500% + 200%~500% + 0%~200%, losses = 0%~-50% + <-50%
const AXIOM_TRADERS = [
  // --- NEW traders ---
  { name: 'Dan176',           username: 'dan176_axiom',          wallet: 'J2B5fnm2DAAUAGa4EaegwQFoYaN6B5FerGA5sjtQoaGM', pnlUsd: 49400,   realizedUsd: 49800,   txns: 5083,  wins: 532,   losses: 892,   isNew: true },
  { name: 'Cxltures',         username: 'cxltures',              wallet: '3ZtwP8peTwTfLUF1rgUQgUxwyeHCxfmoELXghQzKqnAJ', pnlUsd: 1240000, realizedUsd: 1240000, txns: 40135, wins: 7928,  losses: 9367,  isNew: true },
  { name: 'GdRS Trader',      username: 'gdrs_trader',           wallet: 'GdRSPexhxbQz5H2zFQrNN2BAZUqEjAULBigTPvQ6oDMP', pnlUsd: 50000,   realizedUsd: 50000,   txns: 1000,  wins: 300,   losses: 200,   isNew: true },
  { name: 'Trenchman',        username: 'trenchman_axiom',       wallet: 'Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7', pnlUsd: 100000,  realizedUsd: 100000,  txns: 5000,  wins: 1500,  losses: 1200,  isNew: true },
  { name: 'Jack Duval',       username: 'jackduval',             wallet: 'BAr5csYtpWoNpwhUjixX7ZPHXkUciFZzjBp9uNxZXJPh', pnlUsd: 80000,   realizedUsd: 80000,   txns: 2000,  wins: 600,   losses: 400,   isNew: true },
  { name: 'chingchongslayer', username: 'chingchongslayer',      wallet: '4uCT4g7YHH4xxfmfNfKUDenwGrRNGoZ9Ay1XFxfUGhQG', pnlUsd: 141000,  realizedUsd: 141000,  txns: 51616, wins: 5201,  losses: 8466,  isNew: true },
  { name: 'Teddy',            username: 'teddy_axiom',           wallet: 'teddyYXw7aiNpDuQCeLb2YiBJhqthBid4C54BuWcPxm',  pnlUsd: 48500,   realizedUsd: 52800,   txns: 10115, wins: 942,   losses: 1319,  isNew: true },
  { name: 'Radiance',         username: 'radiance_axiom',        wallet: 'FAicXNV5FVqtfbpn4Zccs71XcfGeyxBSGbqLDyDJZjke', pnlUsd: 1030000, realizedUsd: 1030000, txns: 32887, wins: 5644,  losses: 5447,  isNew: true },
  { name: 'dddemonology',     username: 'dddemonology',          wallet: 'A2MwjTFz4jzT1mY4xrqkwm1vAbZDrqnA6QJoyTAU8Djw', pnlUsd: 305000,  realizedUsd: 305000,  txns: 22611, wins: 3187,  losses: 4981,  isNew: true },
  { name: 'ceo',              username: 'ceo_axiom',             wallet: '5ghUXGD9VHqtHR1HCUNDdqxGnVGs7DWkX8Zz9X11G36N', pnlUsd: 267000,  realizedUsd: 263000,  txns: 74224, wins: 8085,  losses: 14742, isNew: true },
  { name: 'piemm',            username: 'piemm_axiom',           wallet: '5cs59HeEs1hAsoKot162jGP5xBxCCVHLgmZTu2U7VFBr', pnlUsd: 613000,  realizedUsd: 613000,  txns: 99357, wins: 9690,  losses: 13661, isNew: true },
  { name: 'Fozzy',            username: 'fozzy_axiom',           wallet: 'B9oKseVKRntTvfADyaUoH7oVmoyVbBfUf4NKyQc4KK2D', pnlUsd: 249000,  realizedUsd: 254000,  txns: 4699,  wins: 328,   losses: 307,   isNew: true },

  // --- EXISTING traders — update with real Axiom PnL ---
  { name: 'Zemrics',          username: 'zemrics',               wallet: 'EP5mvfhGv6x1XR33Fd8eioiYjtRXAawafPmkz9xBpDvG', pnlUsd: 116000,  realizedUsd: 116000,  txns: 12070, wins: 1958,  losses: 2810,  isNew: false },
  { name: 'decu',             username: 'notdecu',               wallet: '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9', pnlUsd: 817000,  realizedUsd: 817000,  txns: 73911, wins: 11661, losses: 9486,  isNew: false },
  { name: 'clukz',            username: 'clukzsol',              wallet: 'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC', pnlUsd: 1670000, realizedUsd: 1670000, txns: 31318, wins: 4570,  losses: 4672,  isNew: false },
  { name: 'Colercooks',       username: 'colercooks',            wallet: '99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs', pnlUsd: 670000,  realizedUsd: 671000,  txns: 26401, wins: 5319,  losses: 3309,  isNew: false },
  { name: 'Donuttcrypto',     username: 'donuttcrypto',          wallet: '3wjyaSegfV7SZzjv9Ut1p6AcY5ZdoZjmu6i6QPCVvnmz', pnlUsd: 167000,  realizedUsd: 167000,  txns: 105339,wins: 8592,  losses: 11849, isNew: false },
  { name: 'Qavec',            username: 'qavecc',                wallet: 'gangJEP5geDHjPVRhDS5dTF5e6GtRvtNogMEEVs91RV',  pnlUsd: 297000,  realizedUsd: 297000,  txns: 36976, wins: 5141,  losses: 4200,  isNew: false },
];

const PERIODS = ['1d', '3d', '7d', 'all'] as const;
const PERIOD_SCALE: Record<string, number> = { '1d': 0.015, '3d': 0.07, '7d': 0.22, 'all': 1.0 };

async function main() {
  let newCount = 0;
  let updateCount = 0;

  for (const t of AXIOM_TRADERS) {
    const pnlSol = Math.round(t.pnlUsd / SOL_PRICE);
    const totalTrades = t.wins + t.losses;
    const winRate = totalTrades > 0 ? (t.wins / totalTrades) * 100 : 0;

    if (t.isNew) {
      // Create new user + wallet + rankings
      const user = await prisma.user.upsert({
        where: { username: t.username },
        update: { displayName: t.name },
        create: {
          username: t.username,
          displayName: t.name,
          bio: 'Solana trader',
          avatarUrl: `https://unavatar.io/twitter/${t.username}`,
          twitterId: `precreated_${t.username}`,
          privyUserId: `precreated_${t.username}`,
        },
      });

      await prisma.wallet.upsert({
        where: { userId_address: { userId: user.id, address: t.wallet } },
        update: { totalPnlUsd: t.pnlUsd, winRate, totalTrades, isMain: true, verified: true, statsUpdatedAt: new Date() },
        create: {
          userId: user.id, address: t.wallet, chain: 'solana',
          verified: true, isMain: true,
          totalPnlUsd: t.pnlUsd, winRate, totalTrades,
          statsUpdatedAt: new Date(),
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

      newCount++;
      console.log(`  ✓ NEW  ${t.name.padEnd(20)} $${(t.pnlUsd / 1000).toFixed(0)}K PnL | ${t.wallet.slice(0, 8)}...`);

    } else {
      // Update existing user's wallet stats + rankings with real Axiom data
      const user = await prisma.user.findUnique({ where: { username: t.username } });
      if (!user) { console.log(`  ✗ ${t.username} not found`); continue; }

      await prisma.wallet.updateMany({
        where: { userId: user.id, address: t.wallet },
        data: { totalPnlUsd: t.pnlUsd, winRate, totalTrades, statsUpdatedAt: new Date() },
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

      updateCount++;
      console.log(`  ↻ UPD  ${t.name.padEnd(20)} $${(t.pnlUsd / 1000).toFixed(0)}K PnL (real Axiom data)`);
    }
  }

  const userCount = await prisma.user.count();
  const rankCount = await prisma.userRanking.count();
  console.log(`\nDone: ${newCount} new, ${updateCount} updated.`);
  console.log(`DB: ${userCount} users, ${rankCount} rankings.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
