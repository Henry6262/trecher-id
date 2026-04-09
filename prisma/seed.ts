/**
 * Seed script — 45 real Solana KOLs with wallets + rankings for all periods.
 * Run: DATABASE_URL=... npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SOL_PRICE = 145;

const KOLS = [
  { name: 'Cented',        twitter: 'cented7',           wallet: 'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o', wins: 86,  losses: 58,  pnlSol: 14262 },
  { name: 'Schoen',        twitter: 'schoen_xyz',         wallet: '5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM', wins: 9,   losses: 10,  pnlSol: 10777 },
  { name: 'theo',          twitter: 'theonomix',          wallet: 'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt', wins: 62,  losses: 78,  pnlSol: 8545  },
  { name: 'Bluey',         twitter: 'blueycryp',          wallet: '6TAHDM5Tod7dBTZdYQxzgJZKxxPfiNV9udPHMiUNumyK', wins: 4,   losses: 26,  pnlSol: 6575  },
  { name: 'Sheep',         twitter: 'imsheepsol',         wallet: '78N177fzNJpp8pG49xDv1efYcTMSzo9tPTKEA9mAVkh2', wins: 32,  losses: 7,   pnlSol: 5567  },
  { name: 'West',          twitter: 'ratwizardx',         wallet: 'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN', wins: 39,  losses: 56,  pnlSol: 5495  },
  { name: 'Sebastian',     twitter: 'saint_pablo123',     wallet: '3BLjRcxWGtR7WRshJ3hL25U3RjWr5Ud98wMcczQqk4Ei', wins: 3,   losses: 2,   pnlSol: 4436  },
  { name: 'Pandora',       twitter: 'pandoraflips',       wallet: 'UxuuMeyX2pZPHmGZ2w3Q8MysvExCAquMtvEfqp2etvm',  wins: 4,   losses: 1,   pnlSol: 3960  },
  { name: 'Orange',        twitter: 'orangesbs',          wallet: '2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv', wins: 9,   losses: 16,  pnlSol: 3129  },
  { name: 'dv',            twitter: 'vibed333',           wallet: 'BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd', wins: 55,  losses: 57,  pnlSol: 3110  },
  { name: 'decu',          twitter: 'notdecu',            wallet: '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9', wins: 53,  losses: 61,  pnlSol: 2169  },
  { name: 'asta',          twitter: 'astaso1',            wallet: 'AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL', wins: 1,   losses: 2,   pnlSol: 1989  },
  { name: 'Kadenox',       twitter: 'kadenox',            wallet: 'B32QbbdDAyhvUQzjcaM5j6ZVKwjCxAwGH5Xgvb9SJqnC', wins: 7,   losses: 1,   pnlSol: 1991  },
  { name: 'Pain',          twitter: 'paincrypt0',         wallet: 'J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa', wins: 3,   losses: 0,   pnlSol: 1864  },
  { name: 'Leens',         twitter: 'leensx100',          wallet: 'LeenseyyUU3ccdBPCFCrrZ8oKU2B3T2uToGGZ7eVABY',  wins: 5,   losses: 3,   pnlSol: 1694  },
  { name: 'Zemrics',       twitter: 'zemrics',            wallet: 'EP5mvfhGv6x1XR33Fd8eioiYjtRXAawafPmkz9xBpDvG', wins: 14,  losses: 14,  pnlSol: 1622  },
  { name: 'Matt',          twitter: 'mattfws',            wallet: '3bzaJd5yZG73EVDz8xosQb7gfZm2LN5auFGh6wnP1n1f', wins: 2,   losses: 5,   pnlSol: 1630  },
  { name: 'Nyhrox',        twitter: 'nyhrox',             wallet: '6S8GezkxYUfZy9JPtYnanbcZTMB87Wjt1qx3c6ELajKC', wins: 7,   losses: 10,  pnlSol: 1614  },
  { name: 'Naruza',        twitter: '0xnaruza',           wallet: 'ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk', wins: 8,   losses: 5,   pnlSol: 1551  },
  { name: 'rambo',         twitter: 'goatedondsticks',    wallet: '2net6etAtTe3Rbq2gKECmQwnzcKVXRaLcHy2Zy1iCiWz', wins: 2,   losses: 4,   pnlSol: 1454  },
  { name: 'Tom',           twitter: 'tdmilky',            wallet: 'CEUA7zVoDRqRYoeHTP58UHU6TR8yvtVbeLrX1dppqoXJ', wins: 5,   losses: 3,   pnlSol: 1410  },
  { name: 'Silver',        twitter: '0xsilver',           wallet: '67Nwfi9hgwqhxGoovT2JGLU67uxfomLwQAWncjXXzU6U', wins: 24,  losses: 25,  pnlSol: 1332  },
  { name: 'Johnson',       twitter: 'johnsoncooks101',    wallet: 'J9TYAsWWidbrcZybmLSfrLzryANf4CgJBLdvwdGuC8MB', wins: 7,   losses: 3,   pnlSol: 1289  },
  { name: 'JB',            twitter: 'jbthequant',         wallet: 'JBrYniqfp9ZVWdrkhMEX2LNGBpYJ673Tzh2m3XsS14p7', wins: 4,   losses: 6,   pnlSol: 1286  },
  { name: 'OGAntD',        twitter: '0gantd',             wallet: '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP', wins: 1,   losses: 1,   pnlSol: 1220  },
  { name: 'bandit',        twitter: 'bandeez',            wallet: '5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X', wins: 43,  losses: 52,  pnlSol: 1086  },
  { name: 'Megga',         twitter: 'megga',              wallet: 'H31vEBxSJk1nQdUN11qZgZyhScyShhscKhvhZZU3dQoU', wins: 12,  losses: 19,  pnlSol: 1075  },
  { name: 'Boomer',        twitter: 'boomerbuilds',       wallet: '4JyenL2p8eQZAQuRS8QAASy7TzEcqAeKGha6bhiJXudh', wins: 4,   losses: 7,   pnlSol: 943   },
  { name: 'Trey',          twitter: 'treysocial',         wallet: '831yhv67QpKqLBJjbmw2xoDUeeFHGUx8RnuRj9imeoEs', wins: 21,  losses: 20,  pnlSol: 929   },
  { name: 'Danny',         twitter: '0xsevere',           wallet: '9FNz4MjPUmnJqTf6yEDbL1D4SsHVh7uA8zRHhR5K138r', wins: 4,   losses: 7,   pnlSol: 835   },
  { name: 'Cowboy',        twitter: 'feibo03',            wallet: '6EDaVsS6enYgJ81tmhEkiKFcb4HuzPUVFZeom6PHUqN3', wins: 7,   losses: 5,   pnlSol: 927   },
  { name: 'Reljoo',        twitter: 'reljoooo',           wallet: 'FsG3BaPmRTdSrPaivbgJsFNCCa8cPfkUtk8VLWXkHpHP', wins: 7,   losses: 14,  pnlSol: 807   },
  { name: 'Donuttcrypto',  twitter: 'donuttcrypto',       wallet: '3wjyaSegfV7SZzjv9Ut1p6AcY5ZdoZjmu6i6QPCVvnmz', wins: 6,   losses: 5,   pnlSol: 803   },
  { name: 'jakey',         twitter: 'jakeyprmr',          wallet: 'B3JyPD3t9ufZWfL3namyvoc258KH74JojSxxurUg9jCT', wins: 5,   losses: 11,  pnlSol: 789   },
  { name: 'EustazZ',       twitter: 'eustazzeus',         wallet: 'FqamE7xrahg7FEWoByrx1o8SeyHt44rpmE6ZQfT7zrve', wins: 20,  losses: 26,  pnlSol: 639   },
  { name: 'chester',       twitter: 'chestererer',        wallet: 'PMJA8UQDyWTFw2Smhyp9jGA6aTaP7jKHR7BPudrgyYN',  wins: 40,  losses: 82,  pnlSol: 327   },
  { name: 'clukz',         twitter: 'clukzsol',           wallet: 'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC', wins: 6,   losses: 8,   pnlSol: 463   },
  { name: 'slingoor',      twitter: 'slingoorio',         wallet: '6mWEJG9LoRdto8TwTdZxmnJpkXpTsEerizcGiCNZvzXd', wins: 6,   losses: 1,   pnlSol: 448   },
  { name: 'Spuno',         twitter: 'spunosounds',        wallet: 'GfXQesPe3Zuwg8JhAt6Cg8euJDTVx751enp9EQQmhzPH', wins: 2,   losses: 0,   pnlSol: 358   },
  { name: 'Hash',          twitter: 'hashbergers',        wallet: 'DNsh1UfJdxmze6T6GV9QK5SoFm7HsM5TRNxVuwVgo8Zj', wins: 2,   losses: 0,   pnlSol: 302   },
  { name: 'Rilsio',        twitter: 'cryptorilsio',       wallet: '4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu', wins: 5,   losses: 5,   pnlSol: 213   },
  { name: 'Coler',         twitter: 'colercooks',         wallet: '99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs', wins: 8,   losses: 13,  pnlSol: 211   },
  { name: 'zeropnl',       twitter: 'im0pnl',             wallet: '4xY9T1Q7foJzJsJ6YZDSsfp9zkzeZsXnxd45SixduMmr', wins: 1,   losses: 0,   pnlSol: 204   },
  { name: 'Qavec',         twitter: 'qavecc',             wallet: 'gangJEP5geDHjPVRhDS5dTF5e6GtRvtNogMEEVs91RV',  wins: 4,   losses: 3,   pnlSol: 273   },
  { name: 'M A M B A',     twitter: 'mambatrades_',       wallet: '4nvNc7dDEqKKLM4Sr9Kgk3t1of6f8G66kT64VoC95LYh', wins: 9,   losses: 31,  pnlSol: 281   },
];

const PERIODS = ['1d', '3d', '7d', 'all'] as const;
const PERIOD_SCALE: Record<string, number> = { '1d': 0.015, '3d': 0.07, '7d': 0.22, 'all': 1.0 };

async function main() {
  console.log(`Seeding ${KOLS.length} KOL traders into DB...`);

  for (const kol of KOLS) {
    const totalTrades = kol.wins + kol.losses;
    const winRate = totalTrades > 0 ? (kol.wins / totalTrades) * 100 : 0;
    const pnlUsd = kol.pnlSol * SOL_PRICE;
    const avatarUrl = `https://unavatar.io/x/${kol.twitter}`;

    // Upsert user
    const user = await prisma.user.upsert({
      where: { username: kol.twitter },
      update: { displayName: kol.name, avatarUrl },
      create: {
        username: kol.twitter,
        displayName: kol.name,
        bio: 'Solana trader',
        avatarUrl,
        twitterId: `precreated_${kol.twitter}`,
        privyUserId: `precreated_${kol.twitter}`,
      },
    });

    // Upsert main wallet
    await prisma.wallet.upsert({
      where: { userId_address: { userId: user.id, address: kol.wallet } },
      update: { totalPnlUsd: pnlUsd, winRate, totalTrades, isMain: true, verified: true, statsUpdatedAt: new Date() },
      create: {
        userId: user.id,
        address: kol.wallet,
        chain: 'solana',
        verified: true,
        isMain: true,
        totalPnlUsd: pnlUsd,
        winRate,
        totalTrades,
        statsUpdatedAt: new Date(),
      },
    });

    // Upsert Twitter link
    await prisma.link.upsert({
      where: { id: `${user.id}_twitter` },
      update: {},
      create: {
        id: `${user.id}_twitter`,
        userId: user.id,
        title: `@${kol.twitter}`,
        url: `https://x.com/${kol.twitter}`,
        icon: 'x',
        order: 0,
      },
    });

    // Upsert UserRanking for all periods
    for (const period of PERIODS) {
      const scale = PERIOD_SCALE[period];
      const jitter = 0.88 + Math.random() * 0.24;
      await prisma.userRanking.upsert({
        where: { userId_period: { userId: user.id, period } },
        update: {
          pnlUsd: Math.round(pnlUsd * scale * jitter),
          pnlSol: Math.round(kol.pnlSol * scale * jitter * 10) / 10,
          winRate,
          trades: Math.max(1, Math.round(totalTrades * scale)),
        },
        create: {
          userId: user.id,
          period,
          pnlUsd: Math.round(pnlUsd * scale * jitter),
          pnlSol: Math.round(kol.pnlSol * scale * jitter * 10) / 10,
          winRate,
          trades: Math.max(1, Math.round(totalTrades * scale)),
        },
      });
    }

    console.log(`  ✓ ${kol.name} (@${kol.twitter}) — ${kol.pnlSol} SOL`);
  }

  const userCount = await prisma.user.count();
  const rankCount = await prisma.userRanking.count();
  console.log(`\nDone. DB now has ${userCount} users, ${rankCount} ranking records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
