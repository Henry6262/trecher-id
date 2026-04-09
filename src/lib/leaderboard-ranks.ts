import { prisma } from './prisma';
import type { WalletSyncHealthReport } from './wallet-sync-health';

export const LEADERBOARD_PERIODS = ['1d', '3d', '7d', '14d', 'all'] as const;

export interface LeaderboardRerankValidation {
  ok: boolean;
  reasons: string[];
  metrics: {
    fullRun: boolean;
    totalWalletsTargeted: number;
    walletErrors: number;
    userErrors: number;
    remediationFailures: number;
    walletWarnings: number;
    walletsNeverSynced: number;
    staleCritical: number;
    continuityRisk: number;
    missingEventCoverage: number;
  };
}

export function validateLeaderboardRerankReadiness(input: {
  fullRun: boolean;
  totalWalletsTargeted: number;
  walletErrors: number;
  userErrors: number;
  remediationFailures: number;
  syncHealth: WalletSyncHealthReport;
}): LeaderboardRerankValidation {
  const reasons: string[] = [];

  if (!input.fullRun) reasons.push('full_run_required');
  if (input.totalWalletsTargeted === 0) reasons.push('no_wallets_targeted');
  if (input.walletErrors > 0) reasons.push('wallet_sync_errors_present');
  if (input.userErrors > 0) reasons.push('user_refresh_errors_present');
  if (input.remediationFailures > 0) reasons.push('wallet_remediation_failures_present');
  if (input.syncHealth.totals.walletsWithWarnings > 0) reasons.push('wallet_sync_warnings_present');
  if (input.syncHealth.totals.walletsNeverSynced > 0) reasons.push('wallets_never_synced');
  if (input.syncHealth.totals.staleCritical > 0) reasons.push('stale_wallets_present');
  if (input.syncHealth.totals.walletsWithContinuityRisk > 0) reasons.push('continuity_risks_present');
  if (input.syncHealth.totals.walletsMissingEventCoverage > 0) reasons.push('missing_event_coverage_present');

  return {
    ok: reasons.length === 0,
    reasons,
    metrics: {
      fullRun: input.fullRun,
      totalWalletsTargeted: input.totalWalletsTargeted,
      walletErrors: input.walletErrors,
      userErrors: input.userErrors,
      remediationFailures: input.remediationFailures,
      walletWarnings: input.syncHealth.totals.walletsWithWarnings,
      walletsNeverSynced: input.syncHealth.totals.walletsNeverSynced,
      staleCritical: input.syncHealth.totals.staleCritical,
      continuityRisk: input.syncHealth.totals.walletsWithContinuityRisk,
      missingEventCoverage: input.syncHealth.totals.walletsMissingEventCoverage,
    },
  };
}

export async function materializeLeaderboardRanks(
  periods: readonly string[] = LEADERBOARD_PERIODS,
): Promise<Array<{ period: string; ranked: number }>> {
  const summary: Array<{ period: string; ranked: number }> = [];

  for (const period of periods) {
    const rankings = await prisma.userRanking.findMany({
      where: { period, trades: { gt: 0 } },
      orderBy: [
        { pnlUsd: 'desc' },
        { winRate: 'desc' },
        { trades: 'desc' },
        { userId: 'asc' },
      ],
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.userRanking.updateMany({
        where: { period },
        data: { rank: null },
      }),
      ...rankings.map((ranking, index) =>
        prisma.userRanking.update({
          where: { id: ranking.id },
          data: { rank: index + 1 },
        }),
      ),
    ]);

    summary.push({ period, ranked: rankings.length });
  }

  return summary;
}
