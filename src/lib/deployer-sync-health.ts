import { prisma } from './prisma';
import {
  WALLET_SYNC_STALE_CRITICAL_HOURS,
  WALLET_SYNC_STALE_WARNING_HOURS,
} from './wallet-sync-health';

export const DEPLOYER_SYNC_STALE_WARNING_HOURS = 36;
export const DEPLOYER_SYNC_STALE_CRITICAL_HOURS = 72;

export type DeployerFreshnessStatus = 'fresh' | 'stale_warning' | 'stale_critical';
export type TradeSyncStatus = 'fresh' | 'stale_warning' | 'stale_critical' | 'never_synced';

export function getDeployerFreshnessStatus(syncedAt: Date, now = Date.now()): DeployerFreshnessStatus {
  const hoursSinceSync = (now - syncedAt.getTime()) / 36e5;
  if (hoursSinceSync >= DEPLOYER_SYNC_STALE_CRITICAL_HOURS) return 'stale_critical';
  if (hoursSinceSync >= DEPLOYER_SYNC_STALE_WARNING_HOURS) return 'stale_warning';
  return 'fresh';
}

export function getTradeSyncStatus(lastSuccessfulSyncAt: Date | null, now = Date.now()): TradeSyncStatus {
  if (!lastSuccessfulSyncAt) return 'never_synced';

  const hoursSinceSync = (now - lastSuccessfulSyncAt.getTime()) / 36e5;
  if (hoursSinceSync >= WALLET_SYNC_STALE_CRITICAL_HOURS) return 'stale_critical';
  if (hoursSinceSync >= WALLET_SYNC_STALE_WARNING_HOURS) return 'stale_warning';
  return 'fresh';
}

function hasValidationReason(reason: string | null | undefined, code: string): boolean {
  return reason?.split('; ').includes(code) ?? false;
}

export interface DeployerSyncHealthIssue {
  username: string;
  walletAddress: string;
  syncedAt: string;
  freshnessStatus: DeployerFreshnessStatus;
  validationStatus: string;
  validationReason: string | null;
  totalDeployed: number;
  totalMigrated: number;
  tokens7d: number;
  tokens30d: number;
  enrichmentStatus: string;
  enrichmentError: string | null;
  lastEnrichedAt: string | null;
  localDeploymentCount: number;
  tradeSyncStatus: TradeSyncStatus;
  walletLastSuccessfulSyncAt: string | null;
  walletLastSyncStatus: string | null;
  walletSyncWarningCode: string | null;
  walletSyncError: string | null;
}

export interface DeployerSyncHealthReport {
  generatedAt: string;
  thresholds: {
    snapshotWarningHours: number;
    snapshotCriticalHours: number;
    tradeWarningHours: number;
    tradeCriticalHours: number;
  };
  totals: {
    snapshots: number;
    snapshotsFresh: number;
    snapshotsStaleWarning: number;
    snapshotsStaleCritical: number;
    validationValid: number;
    validationWarning: number;
    validationInvalid: number;
    enrichmentsSucceeded: number;
    enrichmentsSkipped: number;
    enrichmentsPending: number;
    enrichmentsErrored: number;
    localDeploymentMissing: number;
    localDeploymentsExceedSnapshot: number;
    tradeSyncFresh: number;
    tradeSyncStaleWarning: number;
    tradeSyncStaleCritical: number;
    tradeSyncNever: number;
    fullyReconciled: number;
  };
  latestRun: {
    attemptedAt: string;
    completedAt: string | null;
    status: string;
    limit: number | null;
    skipEnrichment: boolean;
    deployersFetched: number;
    deployersValid: number;
    deployersInvalid: number;
    usersCreated: number;
    usersUpdated: number;
    enrichmentsSucceeded: number;
    enrichmentsFailed: number;
    snapshotWarnings: number;
    error: string | null;
  } | null;
  samples: {
    validationWarnings: DeployerSyncHealthIssue[];
    staleCritical: DeployerSyncHealthIssue[];
    localDeploymentMissing: DeployerSyncHealthIssue[];
    enrichmentErrors: DeployerSyncHealthIssue[];
    tradeSyncStaleCritical: DeployerSyncHealthIssue[];
  };
}

export async function getDeployerSyncHealthReport(
  sampleSize: number = 10,
): Promise<DeployerSyncHealthReport> {
  const snapshots = await prisma.deployerSnapshot.findMany({
    orderBy: { syncedAt: 'asc' },
    select: {
      walletAddress: true,
      syncedAt: true,
      validationStatus: true,
      validationReason: true,
      totalDeployed: true,
      totalMigrated: true,
      tokens7d: true,
      tokens30d: true,
      enrichmentStatus: true,
      enrichmentError: true,
      lastEnrichedAt: true,
      localDeploymentCount: true,
      user: {
        select: {
          username: true,
          wallets: {
            select: {
              address: true,
              lastSuccessfulSyncAt: true,
              lastSyncStatus: true,
              syncWarningCode: true,
              lastSyncError: true,
            },
          },
        },
      },
    },
  });

  const latestRun = await prisma.deployerSyncAudit.findFirst({
    orderBy: { attemptedAt: 'desc' },
  });

  const now = Date.now();
  const issues: DeployerSyncHealthIssue[] = snapshots.map((snapshot) => {
    const wallet =
      snapshot.user.wallets.find((candidate) => candidate.address === snapshot.walletAddress) ??
      snapshot.user.wallets[0] ??
      null;

    return {
      username: snapshot.user.username,
      walletAddress: snapshot.walletAddress,
      syncedAt: snapshot.syncedAt.toISOString(),
      freshnessStatus: getDeployerFreshnessStatus(snapshot.syncedAt, now),
      validationStatus: snapshot.validationStatus,
      validationReason: snapshot.validationReason,
      totalDeployed: snapshot.totalDeployed,
      totalMigrated: snapshot.totalMigrated,
      tokens7d: snapshot.tokens7d,
      tokens30d: snapshot.tokens30d,
      enrichmentStatus: snapshot.enrichmentStatus,
      enrichmentError: snapshot.enrichmentError,
      lastEnrichedAt: snapshot.lastEnrichedAt?.toISOString() ?? null,
      localDeploymentCount: snapshot.localDeploymentCount,
      tradeSyncStatus: getTradeSyncStatus(wallet?.lastSuccessfulSyncAt ?? null, now),
      walletLastSuccessfulSyncAt: wallet?.lastSuccessfulSyncAt?.toISOString() ?? null,
      walletLastSyncStatus: wallet?.lastSyncStatus ?? null,
      walletSyncWarningCode: wallet?.syncWarningCode ?? null,
      walletSyncError: wallet?.lastSyncError ?? null,
    };
  });

  const snapshotsFresh = issues.filter((issue) => issue.freshnessStatus === 'fresh');
  const snapshotsStaleWarning = issues.filter(
    (issue) => issue.freshnessStatus === 'stale_warning',
  );
  const snapshotsStaleCritical = issues.filter(
    (issue) => issue.freshnessStatus === 'stale_critical',
  );
  const validationValid = issues.filter((issue) => issue.validationStatus === 'valid');
  const validationWarning = issues.filter((issue) => issue.validationStatus === 'warning');
  const validationInvalid = issues.filter((issue) => issue.validationStatus === 'invalid');
  const enrichmentsSucceeded = issues.filter((issue) => issue.enrichmentStatus === 'success');
  const enrichmentsSkipped = issues.filter((issue) => issue.enrichmentStatus === 'skipped');
  const enrichmentsPending = issues.filter((issue) => issue.enrichmentStatus === 'pending');
  const enrichmentsErrored = issues.filter((issue) => issue.enrichmentStatus === 'error');
  const localDeploymentMissing = issues.filter((issue) =>
    hasValidationReason(issue.validationReason, 'local_token_deployments_missing'),
  );
  const localDeploymentsExceedSnapshot = issues.filter((issue) =>
    hasValidationReason(issue.validationReason, 'local_deployments_exceed_dune_snapshot'),
  );
  const tradeSyncFresh = issues.filter((issue) => issue.tradeSyncStatus === 'fresh');
  const tradeSyncStaleWarning = issues.filter(
    (issue) => issue.tradeSyncStatus === 'stale_warning',
  );
  const tradeSyncStaleCritical = issues.filter(
    (issue) => issue.tradeSyncStatus === 'stale_critical',
  );
  const tradeSyncNever = issues.filter((issue) => issue.tradeSyncStatus === 'never_synced');
  const fullyReconciled = issues.filter(
    (issue) =>
      issue.freshnessStatus === 'fresh' &&
      issue.validationStatus === 'valid' &&
      issue.enrichmentStatus !== 'error' &&
      issue.tradeSyncStatus === 'fresh',
  );

  return {
    generatedAt: new Date().toISOString(),
    thresholds: {
      snapshotWarningHours: DEPLOYER_SYNC_STALE_WARNING_HOURS,
      snapshotCriticalHours: DEPLOYER_SYNC_STALE_CRITICAL_HOURS,
      tradeWarningHours: WALLET_SYNC_STALE_WARNING_HOURS,
      tradeCriticalHours: WALLET_SYNC_STALE_CRITICAL_HOURS,
    },
    totals: {
      snapshots: issues.length,
      snapshotsFresh: snapshotsFresh.length,
      snapshotsStaleWarning: snapshotsStaleWarning.length,
      snapshotsStaleCritical: snapshotsStaleCritical.length,
      validationValid: validationValid.length,
      validationWarning: validationWarning.length,
      validationInvalid: validationInvalid.length,
      enrichmentsSucceeded: enrichmentsSucceeded.length,
      enrichmentsSkipped: enrichmentsSkipped.length,
      enrichmentsPending: enrichmentsPending.length,
      enrichmentsErrored: enrichmentsErrored.length,
      localDeploymentMissing: localDeploymentMissing.length,
      localDeploymentsExceedSnapshot: localDeploymentsExceedSnapshot.length,
      tradeSyncFresh: tradeSyncFresh.length,
      tradeSyncStaleWarning: tradeSyncStaleWarning.length,
      tradeSyncStaleCritical: tradeSyncStaleCritical.length,
      tradeSyncNever: tradeSyncNever.length,
      fullyReconciled: fullyReconciled.length,
    },
    latestRun: latestRun
      ? {
          attemptedAt: latestRun.attemptedAt.toISOString(),
          completedAt: latestRun.completedAt?.toISOString() ?? null,
          status: latestRun.status,
          limit: latestRun.limit ?? null,
          skipEnrichment: latestRun.skipEnrichment,
          deployersFetched: latestRun.deployersFetched,
          deployersValid: latestRun.deployersValid,
          deployersInvalid: latestRun.deployersInvalid,
          usersCreated: latestRun.usersCreated,
          usersUpdated: latestRun.usersUpdated,
          enrichmentsSucceeded: latestRun.enrichmentsSucceeded,
          enrichmentsFailed: latestRun.enrichmentsFailed,
          snapshotWarnings: latestRun.snapshotWarnings,
          error: latestRun.error ?? null,
        }
      : null,
    samples: {
      validationWarnings: validationWarning.slice(0, sampleSize),
      staleCritical: snapshotsStaleCritical.slice(0, sampleSize),
      localDeploymentMissing: localDeploymentMissing.slice(0, sampleSize),
      enrichmentErrors: enrichmentsErrored.slice(0, sampleSize),
      tradeSyncStaleCritical: tradeSyncStaleCritical.slice(0, sampleSize),
    },
  };
}
