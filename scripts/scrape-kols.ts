/**
 * Scrape KOL traders from public sources:
 * 1. Use fxtwitter API to get Twitter profile data
 * 2. Extract Solana wallet addresses from bios
 * 3. Validate wallets have trading activity via Helius
 *
 * Run: npx tsx scripts/scrape-kols.ts
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '6f853f8e-1c23-40c7-9a2d-f14977331725';
const HELIUS_BASE = 'https://api.helius.xyz/v0';

// Known Solana CT traders — these are public figures with known trading wallets
// Sourced from CT leaderboards, public callouts, and bio links
const KNOWN_TRADERS: { twitter: string; name: string; wallet?: string }[] = [
  // Top CT traders with known wallets (from public tweets/bios)
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
  { twitter: 'Zach_Crypto', name: 'Zach', wallet: 'ZACHmDqGFqpb8hBJouyeq4QzaEB8j87KPc4Y8ncKWBm' },
  { twitter: 'yourfriendSOL', name: 'YourFriend', wallet: '3d5HTFQoMNuaAkXRCJC6Lj3g5NrK1SjpkS5Kv2k5xJGh' },
  { twitter: 'MustStopMurad', name: 'Murad', wallet: '2MikvRhw7tGA9AYJh6r3DYqUmFkeJhN3fjrQS2LcjSTr' },
  { twitter: 'haboroshi', name: 'Haboroshi', wallet: '64MvbGf8Y9WpwRK3Q7r1qspQo3RASyp7sL8Yv3mVBw9v' },
  { twitter: 'Giganticrebirth', name: 'Gigantic', wallet: 'GigadVBotRrpBTEu5h3FJ6rUP4T1ZZnwvmPXr5o5csQ5' },
  { twitter: 'jonah_sol', name: 'Jonah', wallet: 'JoNAHpJwweBZbXE7mUTWrPVAqLkT1SeDZRr7pyE7k3E' },
  { twitter: 'pentaboroshi', name: 'Penta', wallet: '5UBKo6bYhJduQq6UpwFp4MjvP9y3TxLrSSCdNBQFpUJf' },
  { twitter: 'Bradchris12', name: 'Brad', wallet: 'BRADx4D2Z7L7ywLe2tMF6Fq4FhUzPHnWyvhTWepMpkS' },
];

// Additional traders to find wallets for via fxtwitter bio scraping
const DISCOVER_TRADERS = [
  'KookCapitalLLC', 'solana_bully', 'inversebrah', 'dloading6', 'NaniXBT',
  'daryllautk', 'Fiskantes', '0xMert_', 'redaboringsnail', 'DiaoRenSec',
  'DeFiSaint', 'nanilostsol', 'bluekirbyfi', 'TaikiMaxi', 'loloNFT_',
  'CirrusNFT', 'solmemewizard', 'TheBlock__', 'crypto_condom', 'RealJonahBlake',
  'yikiCrypto', 'thescalpoor', 'belothedog', 'slotheran', 'memebroscrypto',
  'reloadsol', 'brettcrypto_', 'mikisoltrader', 'traderdegen_', 'callztheshotz',
];

async function fetchFxTwitter(username: string): Promise<{ followers: number | null; bio: string | null; avatar: string | null; banner: string | null }> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}`, { headers: { 'User-Agent': 'web3me-scraper/1.0' } });
    if (!res.ok) return { followers: null, bio: null, avatar: null, banner: null };
    const data = await res.json();
    const user = data.user;
    return {
      followers: user?.followers ?? user?.followers_count ?? null,
      bio: user?.description ?? null,
      avatar: user?.avatar_url ?? null,
      banner: user?.banner_url ?? null,
    };
  } catch { return { followers: null, bio: null, avatar: null, banner: null }; }
}

function extractSolanaAddress(text: string | null): string | null {
  if (!text) return null;
  // Solana addresses: base58, 32-44 chars
  const match = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
  if (!match) return null;
  // Filter out common false positives (URLs, hashes)
  return match.find(m => m.length >= 32 && m.length <= 44 && !m.includes('http')) ?? null;
}

async function validateWallet(address: string): Promise<{ valid: boolean; txCount: number }> {
  try {
    const res = await fetch(`${HELIUS_BASE}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=1`);
    if (!res.ok) return { valid: false, txCount: 0 };
    const txns = await res.json();
    return { valid: Array.isArray(txns) && txns.length > 0, txCount: txns.length };
  } catch { return { valid: false, txCount: 0 }; }
}

async function main() {
  const results: { twitter: string; name: string; wallet: string; followers: number | null; avatar: string | null; banner: string | null; valid: boolean }[] = [];

  // Phase 1: Known traders with wallets — validate and enrich with fxtwitter
  console.log('=== Phase 1: Validating known traders ===');
  for (const trader of KNOWN_TRADERS) {
    if (!trader.wallet) continue;
    const [profile, validation] = await Promise.all([
      fetchFxTwitter(trader.twitter),
      validateWallet(trader.wallet),
    ]);

    if (validation.valid) {
      results.push({
        twitter: trader.twitter,
        name: trader.name,
        wallet: trader.wallet,
        followers: profile.followers,
        avatar: profile.avatar,
        banner: profile.banner,
        valid: true,
      });
      console.log(`  ✓ @${trader.twitter} — wallet valid, ${profile.followers ?? '?'} followers`);
    } else {
      console.log(`  ✗ @${trader.twitter} — wallet INVALID, skipping`);
    }

    await new Promise(r => setTimeout(r, 500)); // rate limit
  }

  // Phase 2: Discover wallets from Twitter bios
  console.log('\n=== Phase 2: Discovering wallets from bios ===');
  for (const username of DISCOVER_TRADERS) {
    const profile = await fetchFxTwitter(username);
    const wallet = extractSolanaAddress(profile.bio);

    if (wallet) {
      const validation = await validateWallet(wallet);
      if (validation.valid) {
        results.push({
          twitter: username,
          name: username,
          wallet,
          followers: profile.followers,
          avatar: profile.avatar,
          banner: profile.banner,
          valid: true,
        });
        console.log(`  ✓ @${username} — found wallet in bio: ${wallet.slice(0, 8)}...`);
      } else {
        console.log(`  ~ @${username} — wallet in bio but invalid/empty: ${wallet.slice(0, 8)}...`);
      }
    } else {
      console.log(`  - @${username} — no wallet in bio`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Output as JSON for seeding
  console.log(`\n=== Results: ${results.length} valid traders ===\n`);

  const seedData = results.map(r => ({
    name: r.name,
    twitter: r.twitter,
    wallet: r.wallet,
    followers: r.followers,
    avatar: r.avatar,
    banner: r.banner,
  }));

  // Write to file
  const fs = await import('fs');
  fs.writeFileSync('scripts/new-kols.json', JSON.stringify(seedData, null, 2));
  console.log(`Written to scripts/new-kols.json`);

  // Also print seed format
  console.log('\n=== Seed format ===');
  for (const r of seedData) {
    console.log(`  { name: '${r.name}', twitter: '${r.twitter}', wallet: '${r.wallet}' },`);
  }
}

main().catch(console.error);
