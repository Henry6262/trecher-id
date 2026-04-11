// Add devprint top deployer wallets to trecher-id
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEVPRINT_DEPLOYERS = [
  { rank: 2, username: 'deployer_02', displayName: 'Deployer #2', wallet: 'Ffgdi3WvDj4KDJrSWo1JbvCxbTtPu9jJPgMGa7tFwukr', tokens: 1452 },
  { rank: 3, username: 'deployer_03', displayName: 'Deployer #3', wallet: 'Dq3fi8ZmBhkrwHFBChLk2pqV8iAGW9uuJP7coshGzqT6', tokens: 964 },
  { rank: 4, username: 'deployer_04', displayName: 'Deployer #4', wallet: 'whamNNP9tHoxLg92yHvJPdYhghEoC1qYTsh5a2oLbx', tokens: 941 },
  { rank: 5, username: 'deployer_05', displayName: 'Deployer #5', wallet: '7naFFwuEJWeWwWYQUkgAWHsxYKg3KctEuUj42JdAMidP', tokens: 924 },
  { rank: 6, username: 'deployer_06', displayName: 'Deployer #6', wallet: '5JJLDJ9d7WeP4sz6KGNRF3ueEF33dtbsihGVC5eyQu9D', tokens: 838 },
  { rank: 7, username: 'deployer_07', displayName: 'Deployer #7', wallet: '7GhWwhaMgbKiRWxF93Bud6HnHMci6NCLTJyTxG8zFH51', tokens: 829 },
  { rank: 8, username: 'deployer_08', displayName: 'Deployer #8', wallet: 'FLVFRVS4CknUBvZ36WJm1zEz7JbGA5vurbtibr1Wj5jS', tokens: 801 },
  { rank: 9, username: 'deployer_09', displayName: 'Deployer #9', wallet: 'EFaQQTGywnD4CjQQvTugUiyVT4LV9G6MsWqiub8X6unN', tokens: 783 },
  { rank: 10, username: 'deployer_10', displayName: 'Deployer #10', wallet: 'AV7PjXHL5JXZ1YoYRoN9Dsstg1x2UciBupMCXcJP8gUz', tokens: 775 },
  { rank: 11, username: 'deployer_11', displayName: 'Deployer #11', wallet: '5FqUo9aBjsp7QeeyN6Vi2ZmF2fjS4H5EU7wnAQwPy17z', tokens: 740 },
  { rank: 12, username: 'deployer_12', displayName: 'Deployer #12', wallet: '9pkJqJLtefuna3GLtKZyF5DBWwEGUdxZUSGCmf5jZhA9', tokens: 730 },
  { rank: 13, username: 'deployer_13', displayName: 'Deployer #13', wallet: 'FFdBLYqL9rs5fUT38ArE8GV2L3BziEgG5LJUu6sshfkF', tokens: 681 },
  { rank: 14, username: 'deployer_14', displayName: 'Deployer #14', wallet: '9xaPjSYagiWEVddmysThnUERhuaBx4r65j21JjhtHgpG', tokens: 634 },
  { rank: 15, username: 'deployer_15', displayName: 'Deployer #15', wallet: 'D8ePpZLbVCUZqJ8336d9reJvZwbtVuYy17BaowUJDDRB', tokens: 616 },
  { rank: 16, username: 'deployer_16', displayName: 'Deployer #16', wallet: 'pwZ5jRsFKyPGhgcS5uC9SrV3CxdsDptQuLQYiVhGz31', tokens: 610 },
  { rank: 17, username: 'deployer_17', displayName: 'Deployer #17', wallet: 'HiSo5kykqDPs3EG14Fk9QY4B5RvkuEs8oJTiqPX3EDAn', tokens: 590 },
  { rank: 18, username: 'deployer_18', displayName: 'Deployer #18', wallet: 'H8iNFjfjuVE2gTezGFVzmyjihnsv8nvWnxzfPRCwYMHp', tokens: 587 },
  { rank: 19, username: 'deployer_19', displayName: 'Deployer #19', wallet: '4bLHcqw3NSUX6YWgb7Dh73L9rShzfYrSvxb5N9X4ELpj', tokens: 569 },
  { rank: 20, username: 'deployer_20', displayName: 'Deployer #20', wallet: 'GeUnv1jmtviRbR7Gu1JnXSGkUMUgFVBHuEVQVpTaUX1W', tokens: 541 },
  { rank: 0, username: 'test_wallet', displayName: 'Test Wallet', wallet: 'FyPQr9pyuFBLJk8Amn5PyBFcgk3BTZWmCWE2uJHn6TL', tokens: 0 },
  { rank: 0, username: 'treasury_wallet', displayName: 'Treasury', wallet: '4K4jo23HtuCvRXbjahzQNkcAiqH8bQrfaeD7goFkKKPR', tokens: 0 },
];

async function main() {
  console.log('Adding devprint deployer wallets...\n');
  
  const existing = await prisma.wallet.findMany({
    select: { address: true }
  });
  const existingAddresses = new Set(existing.map(w => w.address));
  
  let added = 0;
  let skipped = 0;
  
  for (const d of DEVPRINT_DEPLOYERS) {
    if (existingAddresses.has(d.wallet)) {
      console.log(`SKIP: ${d.wallet} (already exists)`);
      skipped++;
      continue;
    }
    
    const username = d.rank > 0 ? d.username : d.username;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: d.username,
        displayName: d.displayName,
        privyUserId: `devprint_deployer_${d.rank || d.username}`,
        twitterId: `devprint_deployer_${d.rank || d.username}`,
        avatarUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Cdefs%3E%3ClinearGradient id="bg" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0%25" stop-color="hsl(202 72%25 54%25)" /%3E%3Cstop offset="100%25" stop-color="hsl(308 78%25 38%25)" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="96" height="96" rx="24" fill="url(%23bg)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.94)" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700"%3E${d.rank > 0 ? '#' + d.rank : 'DEV'}%3C/text%3E%3C/svg%3E`,
      },
    });
    
    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: user.id,
        address: d.wallet,
        totalPnlUsd: 0,
        winRate: 0,
        totalTrades: 0,
      },
    });
    
    console.log(`ADDED: ${d.username} -> ${d.wallet.slice(0, 12)}... (${d.tokens} tokens created)`);
    added++;
  }
  
  console.log(`\nDone! Added: ${added}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
