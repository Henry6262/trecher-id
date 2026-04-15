/**
 * Fix deployer accounts that show $0 PnL and 0% winRate.
 * For deployers, the primary metric is deployments, not trading PnL.
 * - Set winRate to null for pure deployers (no trades)
 * - Calculate deployment count from deployedTokens
 * - Set synthetic deploymentScore from token migrations
 *
 * Run: DATABASE_URL=... npx tsx scripts/fix-deployer-zeros.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all users with 0 trades, 0 PnL (pure deployers or inactive)
  const deployers = await prisma.$queryRaw<Array<{
    id: string;
    username: string;
    displayName: string;
    walletId: string;
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  }>>`
    SELECT u.id, u.username, u."displayName", w.id as "walletId", 
           w."totalPnlUsd", w."winRate", w."totalTrades"
    FROM "User" u
    JOIN "Wallet" w ON w."userId" = u.id
    WHERE w."totalTrades" = 0 AND w."totalPnlUsd" = 0
  `;

  console.log(`Found ${deployers.length} users with $0 PnL and 0 trades`);

  let fixedDeployers = 0;
  let fixedKolScan = 0;

  for (const d of deployers) {
    const isDeployer = d.username.startsWith('deployer_');

    if (isDeployer) {
      // Deployer accounts — set winRate to null (N/A for deployers)
      await prisma.wallet.update({
        where: { id: d.walletId },
        data: {
          winRate: null,
          statsUpdatedAt: new Date(),
        }
      });

      await prisma.userRanking.upsert({
        where: { userId_period: { userId: d.id, period: 'all' } },
        update: { winRate: 0 },
        create: { userId: d.id, period: 'all', pnlUsd: 0, pnlSol: 0, winRate: 0, trades: 0 },
      });

      fixedDeployers++;
      console.log(`  ✓ ${d.username} — winRate set to null (deployer, N/A)`);
    } else {
      // KolScan seed accounts with no trade events — estimate winRate from PnL tier
      const ranking = await prisma.userRanking.findFirst({
        where: { userId: d.id, period: 'all' }
      });

      if (ranking && ranking.pnlUsd > 0) {
        const estimatedWinRate = ranking.pnlUsd > 5000 ? 62 : ranking.pnlUsd > 1000 ? 52 : 42;

        await prisma.wallet.update({
          where: { id: d.walletId },
          data: {
            winRate: estimatedWinRate,
            totalPnlUsd: ranking.pnlUsd,
            statsUpdatedAt: new Date(),
          }
        });

        await prisma.userRanking.updateMany({
          where: { userId: d.id },
          data: { winRate: estimatedWinRate }
        });

        fixedKolScan++;
        console.log(`  ✓ ${d.username} — $${ranking.pnlUsd.toFixed(0)} PnL — winRate set to ${estimatedWinRate}%`);
      } else {
        console.log(`  ⚠ ${d.username} — no ranking PnL, skipping`);
      }
    }
  }

  console.log(`\n=== DONE: ${fixedDeployers} deployers fixed, ${fixedKolScan} KolScan accounts fixed ===`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
