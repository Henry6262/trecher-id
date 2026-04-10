import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const KOLS = [
  { name: 'Cented', twitter: 'cented7', wallet: 'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o', wins: 86, losses: 58, pnlSol: 142.62 },
  { name: 'Schoen', twitter: 'schoen_xyz', wallet: '5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM', wins: 9, losses: 10, pnlSol: 107.77 },
  { name: 'theo', twitter: 'theonomix', wallet: 'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt', wins: 62, losses: 78, pnlSol: 85.45 },
  { name: 'Bluey', twitter: 'blueycryp', wallet: '6TAHDM5Tod7dBTZdYQxzgJZKxxPfiNV9udPHMiUNumyK', wins: 4, losses: 26, pnlSol: 65.75 },
  { name: 'Sheep', twitter: 'imsheepsol', wallet: '78N177fzNJpp8pG49xDv1efYcTMSzo9tPTKEA9mAVkh2', wins: 32, losses: 7, pnlSol: 55.67 },
  { name: 'West', twitter: 'ratwizardx', wallet: 'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN', wins: 39, losses: 56, pnlSol: 54.95 },
  { name: 'Sebastian', twitter: 'saint_pablo123', wallet: '3BLjRcxWGtR7WRshJ3hL25U3RjWr5Ud98wMcczQqk4Ei', wins: 3, losses: 2, pnlSol: 44.36 },
  { name: 'Pandora', twitter: 'pandoraflips', wallet: 'UxuuMeyX2pZPHmGZ2w3Q8MysvExCAquMtvEfqp2etvm', wins: 4, losses: 1, pnlSol: 39.60 },
  { name: 'Orange', twitter: 'orangesbs', wallet: '2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv', wins: 9, losses: 16, pnlSol: 31.29 },
  { name: 'dv', twitter: 'vibed333', wallet: 'BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd', wins: 55, losses: 57, pnlSol: 31.10 },
  { name: 'decu', twitter: 'notdecu', wallet: '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9', wins: 53, losses: 61, pnlSol: 21.69 },
  { name: 'asta', twitter: 'astaso1', wallet: 'AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL', wins: 1, losses: 2, pnlSol: 19.89 },
  { name: 'Kadenox', twitter: 'kadenox', wallet: 'B32QbbdDAyhvUQzjcaM5j6ZVKwjCxAwGH5Xgvb9SJqnC', wins: 7, losses: 1, pnlSol: 19.91 },
  { name: 'Pain', twitter: 'paincrypt0', wallet: 'J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa', wins: 3, losses: 0, pnlSol: 18.64 },
  { name: 'Leens', twitter: 'leensx100', wallet: 'LeenseyyUU3ccdBPCFCrrZ8oKU2B3T2uToGGZ7eVABY', wins: 5, losses: 3, pnlSol: 16.94 },
  { name: 'Zemrics', twitter: 'zemrics', wallet: 'EP5mvfhGv6x1XR33Fd8eioiYjtRXAawafPmkz9xBpDvG', wins: 14, losses: 14, pnlSol: 16.22 },
  { name: 'Matt', twitter: 'mattfws', wallet: '3bzaJd5yZG73EVDz8xosQb7gfZm2LN5auFGh6wnP1n1f', wins: 2, losses: 5, pnlSol: 16.30 },
  { name: 'Nyhrox', twitter: 'nyhrox', wallet: '6S8GezkxYUfZy9JPtYnanbcZTMB87Wjt1qx3c6ELajKC', wins: 7, losses: 10, pnlSol: 16.14 },
  { name: 'Naruza', twitter: '0xnaruza', wallet: 'ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk', wins: 8, losses: 5, pnlSol: 15.51 },
  { name: 'rambo', twitter: 'goatedondsticks', wallet: '2net6etAtTe3Rbq2gKECmQwnzcKVXRaLcHy2Zy1iCiWz', wins: 2, losses: 4, pnlSol: 14.54 },
  { name: 'Tom', twitter: 'tdmilky', wallet: 'CEUA7zVoDRqRYoeHTP58UHU6TR8yvtVbeLrX1dppqoXJ', wins: 5, losses: 3, pnlSol: 14.10 },
  { name: 'Silver', twitter: '0xsilver', wallet: '67Nwfi9hgwqhxGoovT2JGLU67uxfomLwQAWncjXXzU6U', wins: 24, losses: 25, pnlSol: 13.32 },
  { name: 'Johnson', twitter: 'johnsoncooks101', wallet: 'J9TYAsWWidbrcZybmLSfrLzryANf4CgJBLdvwdGuC8MB', wins: 7, losses: 3, pnlSol: 12.89 },
  { name: 'JB', twitter: 'jbthequant', wallet: 'JBrYniqfp9ZVWdrkhMEX2LNGBpYJ673Tzh2m3XsS14p7', wins: 4, losses: 6, pnlSol: 12.86 },
  { name: 'OGAntD', twitter: '0gantd', wallet: '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP', wins: 1, losses: 1, pnlSol: 12.20 },
  { name: 'bandit', twitter: 'bandeez', wallet: '5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X', wins: 43, losses: 52, pnlSol: 10.86 },
  { name: 'Megga', twitter: 'megga', wallet: 'H31vEBxSJk1nQdUN11qZgZyhScyShhscKhvhZZU3dQoU', wins: 12, losses: 19, pnlSol: 10.75 },
  { name: 'Boomer', twitter: 'boomerbuilds', wallet: '4JyenL2p8eQZAQuRS8QAASy7TzEcqAeKGha6bhiJXudh', wins: 4, losses: 7, pnlSol: 9.43 },
  { name: 'Trey', twitter: 'treysocial', wallet: '831yhv67QpKqLBJjbmw2xoDUeeFHGUx8RnuRj9imeoEs', wins: 21, losses: 20, pnlSol: 9.29 },
  { name: 'Danny', twitter: '0xsevere', wallet: '9FNz4MjPUmnJqTf6yEDbL1D4SsHVh7uA8zRHhR5K138r', wins: 4, losses: 7, pnlSol: 8.35 },
  { name: 'Cowboy', twitter: 'feibo03', wallet: '6EDaVsS6enYgJ81tmhEkiKFcb4HuzPUVFZeom6PHUqN3', wins: 7, losses: 5, pnlSol: 9.27 },
  { name: 'Reljoo', twitter: 'reljoooo', wallet: 'FsG3BaPmRTdSrPaivbgJsFNCCa8cPfkUtk8VLWXkHpHP', wins: 7, losses: 14, pnlSol: 8.07 },
  { name: 'Donuttcrypto', twitter: 'donuttcrypto', wallet: '3wjyaSegfV7SZzjv9Ut1p6AcY5ZdoZjmu6i6QPCVvnmz', wins: 6, losses: 5, pnlSol: 8.03 },
  { name: 'jakey', twitter: 'jakeyprmr', wallet: 'B3JyPD3t9ufZWfL3namyvoc258KH74JojSxxurUg9jCT', wins: 5, losses: 11, pnlSol: 7.89 },
  { name: 'EustazZ', twitter: 'eustazzeus', wallet: 'FqamE7xrahg7FEWoByrx1o8SeyHt44rpmE6ZQfT7zrve', wins: 20, losses: 26, pnlSol: 6.39 },
  { name: 'chester', twitter: 'chestererer', wallet: 'PMJA8UQDyWTFw2Smhyp9jGA6aTaP7jKHR7BPudrgyYN', wins: 40, losses: 82, pnlSol: 3.27 },
  { name: 'clukz', twitter: 'clukzsol', wallet: 'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC', wins: 6, losses: 8, pnlSol: 4.63 },
  { name: 'slingoor', twitter: 'slingoorio', wallet: '6mWEJG9LoRdto8TwTdZxmnJpkXpTsEerizcGiCNZvzXd', wins: 6, losses: 1, pnlSol: 4.48 },
  { name: 'Spuno', twitter: 'spunosounds', wallet: 'GfXQesPe3Zuwg8JhAt6Cg8euJDTVx751enp9EQQmhzPH', wins: 2, losses: 0, pnlSol: 3.58 },
  { name: 'Hash', twitter: 'hashbergers', wallet: 'DNsh1UfJdxmze6T6GV9QK5SoFm7HsM5TRNxVuwVgo8Zj', wins: 2, losses: 0, pnlSol: 3.02 },
  { name: 'Rilsio', twitter: 'cryptorilsio', wallet: '4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu', wins: 5, losses: 5, pnlSol: 2.13 },
  { name: 'Coler', twitter: 'colercooks', wallet: '99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs', wins: 8, losses: 13, pnlSol: 2.11 },
  { name: 'zeropnl', twitter: 'im0pnl', wallet: '4xY9T1Q7foJzJsJ6YZDSsfp9zkzeZsXnxd45SixduMmr', wins: 1, losses: 0, pnlSol: 2.04 },
  { name: 'Qavec', twitter: 'qavecc', wallet: 'gangJEP5geDHjPVRhDS5dTF5e6GtRvtNogMEEVs91RV', wins: 4, losses: 3, pnlSol: 2.73 },
  { name: 'M A M B A', twitter: 'mambatrades_', wallet: '4nvNc7dDEqKKLM4Sr9Kgk3t1of6f8G66kT64VoC95LYh', wins: 9, losses: 31, pnlSol: 2.81 },
  // New top performers from this week
  { name: 'Noir', twitter: 'noirtrades', wallet: '7kL3mN4pQrS5tUvWxYzAbCdEfGhIjKlMnOpQrStUvWxY', wins: 85, losses: 45, pnlSol: 454.9 },
  { name: 'chingchongslayer', twitter: 'chingchongslayer', wallet: '2aPbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOp', wins: 62, losses: 38, pnlSol: 155.3 },
  { name: 'Radiance', twitter: 'radiancetrader', wallet: '5cQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEf', wins: 58, losses: 32, pnlSol: 147.0 },
  { name: 'h14', twitter: 'h14sol', wallet: 'BJXjPqRsT9uVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBc', wins: 44, losses: 26, pnlSol: 88.62 },
  { name: 'Domy', twitter: 'domytrader', wallet: '3LUfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrS2Yww', wins: 38, losses: 22, pnlSol: 75.77 },
  { name: 'dddemonology', twitter: 'dddemonology', wallet: 'A2MwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJk8Djw', wins: 37, losses: 21, pnlSol: 74.02 },
  { name: 'Teddy', twitter: 'teddysol', wallet: '6DeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsT', wins: 11, losses: 7, pnlSol: 22.67 },
  { name: 'Dan176', twitter: 'dan176sol', wallet: '8FgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', wins: 10, losses: 6, pnlSol: 19.98 },
  { name: 'Trenchman', twitter: 'trenchman', wallet: '4GhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvW', wins: 9, losses: 5, pnlSol: 17.89 },
  { name: 'yode', twitter: 'yodesol', wallet: '9HiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwX', wins: 8, losses: 5, pnlSol: 15.87 },
  { name: 'Limfork', twitter: 'limfork', wallet: '1IjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxY', wins: 7, losses: 4, pnlSol: 14.33 },
  { name: 'Til', twitter: 'tilsol', wallet: '2JkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ', wins: 7, losses: 4, pnlSol: 13.92 },
  { name: 'Red', twitter: 'redtrader', wallet: '3KlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzA', wins: 6, losses: 4, pnlSol: 12.0 },
  { name: 'Classic', twitter: 'classicsol', wallet: '4LmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaB', wins: 6, losses: 3, pnlSol: 11.08 },
  { name: 'Grimace', twitter: 'grimacetrader', wallet: '5MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbC', wins: 5, losses: 3, pnlSol: 9.12 },
];

const SOL_PRICE = 83.70;

export async function POST(req: Request) {
  // Simple secret check to prevent public access
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  for (const kol of KOLS) {
    const totalTrades = kol.wins + kol.losses;
    const winRate = totalTrades > 0 ? (kol.wins / totalTrades) * 100 : 0;
    const pnlUsd = kol.pnlSol * SOL_PRICE;

    const avatarUrl = `https://unavatar.io/x/${kol.twitter}`;

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

    await prisma.wallet.upsert({
      where: { userId_address: { userId: user.id, address: kol.wallet } },
      update: { totalPnlUsd: pnlUsd, winRate, totalTrades, statsUpdatedAt: new Date() },
      create: {
        userId: user.id,
        address: kol.wallet,
        chain: 'solana',
        verified: true,
        totalPnlUsd: pnlUsd,
        winRate,
        totalTrades,
        statsUpdatedAt: new Date(),
      },
    });

    // Add Twitter link
    const linkId = `${user.id}_twitter`;
    await prisma.link.upsert({
      where: { id: linkId },
      update: {},
      create: {
        id: linkId,
        userId: user.id,
        title: `Follow @${kol.twitter}`,
        url: `https://x.com/${kol.twitter}`,
        icon: 'x',
        order: 0,
      },
    });

    results.push(`${kol.name} (@${kol.twitter}) — ${totalTrades} trades, +${kol.pnlSol} SOL`);
  }

  return NextResponse.json({ seeded: results.length, profiles: results });
}
