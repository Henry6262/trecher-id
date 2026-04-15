
import { prisma } from '@/lib/prisma';
import { getSolPrice } from '@/lib/sol-price';

export const VAULT_FEE_BPS = 10; // 0.1% of volume goes to vault
export const WEEKLY_PAYOUT_PERCENTAGE = 0.50; // 50% of vault goes to weekly leaderboard
export const CUP_RESERVE_PERCENTAGE = 0.50; // 50% reserved for cup prizes

/**
 * Record a deposit into the reward vault.
 */
export async function addVaultDeposit(amountSol: number, source: string, description?: string) {
  const solPrice = await getSolPrice();
  return prisma.vaultDeposit.create({
    data: {
      amountSol,
      amountUsd: amountSol * solPrice,
      source,
      description,
    },
  });
}

/**
 * Calculate and distribute rewards for the weekly leaderboard (Top 10).
 * Usually called on Sundays.
 */
export async function processWeeklyLeaderboardPayouts() {
  const solPrice = await getSolPrice();
  
  // 1. Calculate total vault balance from deposits that haven't been distributed
  // (Simplified: we'll just look at deposits in the last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const deposits = await prisma.vaultDeposit.findMany({
    where: { timestamp: { gte: weekAgo } },
  });

  const totalVaultSol = deposits.reduce((sum, d) => sum + d.amountSol, 0);
  const distributableSol = totalVaultSol * WEEKLY_PAYOUT_PERCENTAGE;

  if (distributableSol <= 0) return { success: false, message: 'No funds in vault to distribute' };

  // 2. Get Top 10 from 7d leaderboard
  const topTraders = await prisma.userRanking.findMany({
    where: { period: '7d' },
    orderBy: { pnlUsd: 'desc' },
    take: 10,
    include: { user: true },
  });

  if (topTraders.length === 0) return { success: false, message: 'No traders found on leaderboard' };

  // 3. Define distribution split for Top 10
  // 1st: 30%, 2nd: 20%, 3rd: 15%, 4th: 10%, 5th: 5%, 6-10th: 4% each
  const splits = [0.30, 0.20, 0.15, 0.10, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04];
  
  const payouts = [];

  for (let i = 0; i < topTraders.length; i++) {
    const trader = topTraders[i];
    const sharePct = splits[i] || 0;
    const amountSol = distributableSol * sharePct;
    
    if (amountSol > 0) {
      const payout = await createPayout(
        trader.userId, 
        amountSol, 
        solPrice, 
        'weekly_leaderboard'
      );
      payouts.push(payout);
    }
  }

  return { 
    success: true, 
    totalDistributedSol: distributableSol, 
    payoutCount: payouts.length 
  };
}

/**
 * Helper to create a payout and update user reward account.
 */
async function createPayout(userId: string, amountSol: number, solPrice: number, type: string) {
  const amountUsd = amountSol * solPrice;

  // 1. Create Payout record
  const payout = await prisma.vaultPayout.create({
    data: {
      userId,
      amountSol,
      amountUsd,
      type,
      status: 'pending',
    },
  });

  // 2. Update/Create UserRewardAccount
  await prisma.userRewardAccount.upsert({
    where: { userId },
    create: {
      userId,
      totalEarnedUsd: amountUsd,
      pendingUsd: amountUsd,
    },
    update: {
      totalEarnedUsd: { increment: amountUsd },
      pendingUsd: { increment: amountUsd },
    },
  });

  return payout;
}

/**
 * Get user's reward summary.
 */
export async function getUserRewards(userId: string) {
  const account = await prisma.userRewardAccount.findUnique({
    where: { userId },
  });

  const payouts = await prisma.vaultPayout.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    account: account || { totalEarnedUsd: 0, totalPaidUsd: 0, pendingUsd: 0 },
    history: payouts,
  };
}
