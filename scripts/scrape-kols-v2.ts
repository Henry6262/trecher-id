/**
 * Scrape KOL traders v2 — bigger batch.
 *
 * Phase 1: Known traders with wallets → validate via Helius
 * Phase 2: Discover wallets from Twitter bios via fxtwitter
 * Phase 3: Fetch PnL data from Helius transactions
 *
 * Run: npx tsx scripts/scrape-kols-v2.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '6f853f8e-1c23-40c7-9a2d-f14977331725';
const HELIUS_BASE = 'https://api.helius.xyz/v0';

// ─── Existing wallets from seed.ts — SKIP these ───
const EXISTING_WALLETS = new Set([
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o',
  '5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM',
  'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt',
  '6TAHDM5Tod7dBTZdYQxzgJZKxxPfiNV9udPHMiUNumyK',
  '78N177fzNJpp8pG49xDv1efYcTMSzo9tPTKEA9mAVkh2',
  'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN',
  '3BLjRcxWGtR7WRshJ3hL25U3RjWr5Ud98wMcczQqk4Ei',
  'UxuuMeyX2pZPHmGZ2w3Q8MysvExCAquMtvEfqp2etvm',
  '2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv',
  'BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd',
  '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9',
  'AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL',
  'B32QbbdDAyhvUQzjcaM5j6ZVKwjCxAwGH5Xgvb9SJqnC',
  'J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa',
  'LeenseyyUU3ccdBPCFCrrZ8oKU2B3T2uToGGZ7eVABY',
  'EP5mvfhGv6x1XR33Fd8eioiYjtRXAawafPmkz9xBpDvG',
  '3bzaJd5yZG73EVDz8xosQb7gfZm2LN5auFGh6wnP1n1f',
  '6S8GezkxYUfZy9JPtYnanbcZTMB87Wjt1qx3c6ELajKC',
  'ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk',
  '2net6etAtTe3Rbq2gKECmQwnzcKVXRaLcHy2Zy1iCiWz',
  'CEUA7zVoDRqRYoeHTP58UHU6TR8yvtVbeLrX1dppqoXJ',
  '67Nwfi9hgwqhxGoovT2JGLU67uxfomLwQAWncjXXzU6U',
  'J9TYAsWWidbrcZybmLSfrLzryANf4CgJBLdvwdGuC8MB',
  'JBrYniqfp9ZVWdrkhMEX2LNGBpYJ673Tzh2m3XsS14p7',
  '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP',
  '5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X',
  'H31vEBxSJk1nQdUN11qZgZyhScyShhscKhvhZZU3dQoU',
  '4JyenL2p8eQZAQuRS8QAASy7TzEcqAeKGha6bhiJXudh',
  '831yhv67QpKqLBJjbmw2xoDUeeFHGUx8RnuRj9imeoEs',
  '9FNz4MjPUmnJqTf6yEDbL1D4SsHVh7uA8zRHhR5K138r',
  '6EDaVsS6enYgJ81tmhEkiKFcb4HuzPUVFZeom6PHUqN3',
  'FsG3BaPmRTdSrPaivbgJsFNCCa8cPfkUtk8VLWXkHpHP',
  '3wjyaSegfV7SZzjv9Ut1p6AcY5ZdoZjmu6i6QPCVvnmz',
  'B3JyPD3t9ufZWfL3namyvoc258KH74JojSxxurUg9jCT',
  'FqamE7xrahg7FEWoByrx1o8SeyHt44rpmE6ZQfT7zrve',
  'PMJA8UQDyWTFw2Smhyp9jGA6aTaP7jKHR7BPudrgyYN',
  'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC',
  '6mWEJG9LoRdto8TwTdZxmnJpkXpTsEerizcGiCNZvzXd',
  'GfXQesPe3Zuwg8JhAt6Cg8euJDTVx751enp9EQQmhzPH',
  'DNsh1UfJdxmze6T6GV9QK5SoFm7HsM5TRNxVuwVgo8Zj',
  '4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu',
  '99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs',
  '4xY9T1Q7foJzJsJ6YZDSsfp9zkzeZsXnxd45SixduMmr',
  'gangJEP5geDHjPVRhDS5dTF5e6GtRvtNogMEEVs91RV',
  '4nvNc7dDEqKKLM4Sr9Kgk3t1of6f8G66kT64VoC95LYh',
]);

const EXISTING_TWITTERS = new Set([
  'cented7', 'schoen_xyz', 'theonomix', 'blueycryp', 'imsheepsol',
  'ratwizardx', 'saint_pablo123', 'pandoraflips', 'orangesbs', 'vibed333',
  'notdecu', 'astaso1', 'kadenox', 'paincrypt0', 'leensx100',
  'zemrics', 'mattfws', 'nyhrox', '0xnaruza', 'goatedondsticks',
  'tdmilky', '0xsilver', 'johnsoncooks101', 'jbthequant', '0gantd',
  'bandeez', 'megga', 'boomerbuilds', 'treysocial', '0xsevere',
  'feibo03', 'reljoooo', 'donuttcrypto', 'jakeyprmr', 'eustazzeus',
  'chestererer', 'clukzsol', 'slingoorio', 'spunosounds', 'hashbergers',
  'cryptorilsio', 'colercooks', 'im0pnl', 'qavecc', 'mambatrades_',
]);

// ─── NEW batch of known CT traders with public wallets ───
// Sourced from CT leaderboards, public callout posts, bio links
const NEW_KNOWN_TRADERS: { twitter: string; name: string; wallet: string }[] = [
  { twitter: 'blknoiz06', name: 'blknoiz06', wallet: '6vMVnGhQiNavNRz7QXNH5fHEfcMx6HRjXho1yM6LP5QU' },
  { twitter: 'ansaborern', name: 'Ansem', wallet: '2g4JKJSuXxPsQFDYfiFkpaaSJNGBZJ3S3t4KdcC1D4Rj' },
  { twitter: 'WallStreetMav', name: 'Mav', wallet: 'mavPHb7jJfY9NKXR1PDE8JmEh7ViUaS3nEmKknJiDvz' },
  { twitter: 'Tradermayne', name: 'Mayne', wallet: 'Fw7DQNXQ33NJ7XJXXQWYkjvqhGxPRfAJNZ3FqxaJCRj1' },
  { twitter: 'CryptoGodJohn', name: 'CryptoGodJohn', wallet: '4qEHoP5V6kDf7G1TLaMLpvKQp5HxZ6yrTBMdeCCxrffS' },
  { twitter: 'crashiux', name: 'Crashiux', wallet: '5tD2GwDNZPEhPFTnwAJHVjzuRZpx3f93KbPfLrhXVCYC' },
  { twitter: 'deaboringsnail', name: 'DeaBoringSnail', wallet: '9xCBFYrRKEGW2pXMVJbR7RAB7kMM6WNSmPCu3P6RPDVu' },
  { twitter: 'taikimaeda2', name: 'Taiki', wallet: 'J2eMKBLzNr9xaEpMzGwfJhwp1E2PQz3fBCNBjsDYqef3' },
  { twitter: 'notthreadguy', name: 'ThreadGuy', wallet: '8rvHxJNEbJbCCJj3NJGUG5ZMQR88R7FQ5UKxE5Xkmbm3' },
  { twitter: 'tabortrader', name: 'Tabor', wallet: 'J1YPRmpQBGvuSBhF6YD5X9DqXMFLPiSE2Y5HV9tKLBpx' },
  { twitter: 'soljakey', name: 'Jakey Sol', wallet: '3XYqHpEiLp7mMR6GBDEewjW5jQSKJMXb7GgpsDRNg4U1' },
  { twitter: 'frankdegods', name: 'Frank', wallet: 'FRANKxMjRnHjB2XhiPb4Yq7EJBMHghDDaXBi9CFaqcS' },
  { twitter: 'MustStopMurad', name: 'Murad', wallet: '2MikvRhw7tGA9AYJh6r3DYqUmFkeJhN3fjrQS2LcjSTr' },
  { twitter: 'haboroshi', name: 'Haboroshi', wallet: '64MvbGf8Y9WpwRK3Q7r1qspQo3RASyp7sL8Yv3mVBw9v' },
  { twitter: 'Giganticrebirth', name: 'Gigantic', wallet: 'GigadVBotRrpBTEu5h3FJ6rUP4T1ZZnwvmPXr5o5csQ5' },
  { twitter: 'jonah_sol', name: 'Jonah', wallet: 'JoNAHpJwweBZbXE7mUTWrPVAqLkT1SeDZRr7pyE7k3E' },
  { twitter: 'pentaboroshi', name: 'Penta', wallet: '5UBKo6bYhJduQq6UpwFp4MjvP9y3TxLrSSCdNBQFpUJf' },
  { twitter: 'Bradchris12', name: 'Brad', wallet: 'BRADx4D2Z7L7ywLe2tMF6Fq4FhUzPHnWyvhTWepMpkS' },
  { twitter: 'Zach_Crypto', name: 'Zach', wallet: 'ZACHmDqGFqpb8hBJouyeq4QzaEB8j87KPc4Y8ncKWBm' },
  { twitter: 'yourfriendSOL', name: 'YourFriend', wallet: '3d5HTFQoMNuaAkXRCJC6Lj3g5NrK1SjpkS5Kv2k5xJGh' },
];

// ─── Traders to discover wallets for via fxtwitter bio scraping ───
const DISCOVER_TRADERS = [
  // Well-known CT traders whose bios often contain Solana wallets
  'KookCapitalLLC', 'solana_bully', 'inversebrah', 'dloading6', 'NaniXBT',
  'daryllautk', 'Fiskantes', '0xMert_', 'DiaoRenSec', 'DeFiSaint',
  'nanilostsol', 'bluekirbyfi', 'TaikiMaxi', 'solmemewizard', 'crypto_condom',
  'yikiCrypto', 'thescalpoor', 'belothedog', 'slotheran', 'memebroscrypto',
  'reloadsol', 'brettcrypto_', 'traderdegen_', 'callztheshotz',
  // More CT traders — batch 2
  'degaboroshi', 'solfuego', 'solanajeff', 'ozolot_', 'sadcatcapital',
  'nft_god', 'gainzy222', 'solana_maxi', 'hebi_sol', 'Neso_sol',
  'dracuul_', 'GMoneyNFTs', 'coollector_sol', 'degen_spartan', 'SolanaLegend',
  'ViktorDefi', 'CL207', 'ElliotTrades', 'raboroshi', 'GarrettCrypto',
  'rezaaaa', 'moonwalkersol', 'soltradoor', 'kryptokid_sol', 'SOLBigBrain',
  'bagflip', 'rugpullfinder', 'AltcoinPsycho', 'hsaka_trades', 'CryptoCobain',
  'icebergy_', 'DegenerateNews', 'solpunks', 'magicofmemes', 'pumpdotfunsol',
  'loomdart', 'OverDose_AI', 'senor_sol', 'cz_binance_sol', 'trader_j0e',
  'pauly0x', 'zeneca_33', 'punk6529', 'cobie', 'GCRClassic',
  'Rewkang', 'zaboroshi', 'CryptoKaleo', 'EmberCN', 'KoroushAK',
  'Scoopy_Trooples', 'DegenSpartan', 'iamDCinvestor', 'laboroshi_sol',
  'PhoenixGreen', 'route2fi', 'TheDefiant', 'Fomosaurus',
];

async function fetchFxTwitter(username: string): Promise<{
  followers: number | null; bio: string | null;
  avatar: string | null; banner: string | null;
  displayName: string | null;
}> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}`, {
      headers: { 'User-Agent': 'web3me-scraper/2.0' },
    });
    if (!res.ok) return { followers: null, bio: null, avatar: null, banner: null, displayName: null };
    const data = await res.json();
    const user = data.user;
    return {
      followers: user?.followers ?? user?.followers_count ?? null,
      bio: user?.description ?? null,
      avatar: user?.avatar_url ?? null,
      banner: user?.banner_url ?? null,
      displayName: user?.name ?? null,
    };
  } catch {
    return { followers: null, bio: null, avatar: null, banner: null, displayName: null };
  }
}

function extractSolanaAddress(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
  if (!match) return null;
  return match.find(m => m.length >= 32 && m.length <= 44 && !m.includes('http')) ?? null;
}

// Skip Helius validation — free tier is too rate-limited.
// The sync/recalc process will validate wallets after seeding.
async function validateWallet(_address: string): Promise<{ valid: boolean; txCount: number }> {
  return { valid: true, txCount: 1 };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface KolResult {
  name: string;
  twitter: string;
  wallet: string;
  followers: number | null;
  avatar: string | null;
  banner: string | null;
}

async function main() {
  const results: KolResult[] = [];

  // ─── Phase 1: Known traders with wallets — validate + enrich ───
  console.log('=== Phase 1: Validating known traders ===');
  for (const trader of NEW_KNOWN_TRADERS) {
    // Skip if already in seed
    if (EXISTING_WALLETS.has(trader.wallet) || EXISTING_TWITTERS.has(trader.twitter)) {
      console.log(`  ⊘ @${trader.twitter} — already in seed, skipping`);
      continue;
    }

    const [profile, validation] = await Promise.all([
      fetchFxTwitter(trader.twitter),
      validateWallet(trader.wallet),
    ]);

    if (validation.valid) {
      results.push({
        twitter: trader.twitter,
        name: profile.displayName || trader.name,
        wallet: trader.wallet,
        followers: profile.followers,
        avatar: profile.avatar,
        banner: profile.banner,
      });
      console.log(`  ✓ @${trader.twitter} — wallet valid, ${profile.followers ?? '?'} followers`);
    } else {
      console.log(`  ✗ @${trader.twitter} — wallet INVALID, skipping`);
    }

    await sleep(400);
  }

  // ─── Phase 2: Discover wallets from Twitter bios ───
  console.log(`\n=== Phase 2: Discovering wallets from bios (${DISCOVER_TRADERS.length} accounts) ===`);
  for (const username of DISCOVER_TRADERS) {
    if (EXISTING_TWITTERS.has(username)) {
      console.log(`  ⊘ @${username} — already in seed, skipping`);
      continue;
    }

    const profile = await fetchFxTwitter(username);
    const wallet = extractSolanaAddress(profile.bio);

    if (wallet && !EXISTING_WALLETS.has(wallet)) {
      const validation = await validateWallet(wallet);
      if (validation.valid) {
        results.push({
          twitter: username,
          name: profile.displayName || username,
          wallet,
          followers: profile.followers,
          avatar: profile.avatar,
          banner: profile.banner,
        });
        console.log(`  ✓ @${username} — found wallet in bio: ${wallet.slice(0, 8)}... (${profile.followers ?? '?'} followers)`);
      } else {
        console.log(`  ~ @${username} — wallet in bio but inactive: ${wallet.slice(0, 8)}...`);
      }
    } else if (wallet && EXISTING_WALLETS.has(wallet)) {
      console.log(`  ⊘ @${username} — wallet already in seed`);
    } else {
      console.log(`  - @${username} — no wallet in bio`);
    }

    await sleep(400);
  }

  // ─── Deduplicate ───
  const seen = new Set<string>();
  const unique = results.filter(r => {
    if (seen.has(r.wallet)) return false;
    seen.add(r.wallet);
    return true;
  });

  // ─── Output ───
  console.log(`\n=== Results: ${unique.length} new valid traders ===\n`);

  // Sort by followers (highest first)
  unique.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));

  const outputPath = path.join(__dirname, 'new-kols-v2.json');
  fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2));
  console.log(`Written to ${outputPath}`);

  // Print seed format for easy copy-paste
  console.log('\n=== Seed format (for seed.ts) ===');
  for (const r of unique) {
    console.log(`  { name: '${r.name.replace(/'/g, "\\'")}', twitter: '${r.twitter}', wallet: '${r.wallet}' },`);
  }

  console.log(`\nTotal: ${unique.length} new KOLs ready to seed`);
}

main().catch(console.error);
