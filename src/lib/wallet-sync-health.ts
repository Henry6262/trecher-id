import { prisma } from './prisma';

export const WALLET_SYNC_STALE_WARNING_HOURS = 6;
export const WALLET_SYNC_STALE_CRITICAL_HOURS = 24;

export type WalletSyncMode = 'incremental' | 'rebuild' | 'backfill';
export type WalletSyncStatus = 'success' | 'error';
export type WalletSyncWarningCode =
  | 'new_transactions_unparsed'
  | 'aggregate_without_events';
export type WalletContinuityStatus =
  | 'ok'
  | 'bootstrap'
  | 'full_rebuild'
  | 'cursor_not_found'
  | 'page_limit_reached';
export type WalletHistoryCoverageStatus =
  | 'complete'
  | 'partial_page_limit'
  | 'unknown';

export function getWalletSyncWarningCode(input: {
  txnsFetched: number;
  candidateTxCount: number;
  tradeRows: number;
  eventRows: number;
}): WalletSyncWarningCode | null {
  if (
    input.txnsFetched > 0 &&
    input.candidateTxCount > 0 &&
    input.tradeRows === 0 &&
    input.eventRows === 0
  ) {
    return 'new_transactions_unparsed';
  }

  if (input.tradeRows > 0 && input.eventRows === 0) {
    return 'aggregate_without_events';
  }

  return null;
}

export function describeWalletSyncWarning(code: string | null | undefined): string | null {
  switch (code) {
    case 'new_transactions_unparsed':
      return 'New transactions arrived but no trades were parsed';
    case 'aggregate_without_events':
      return 'Aggregate trade rows updated without exact event rows';
    default:
      return null;
  }
}

export function describeWalletContinuityStatus(status: string | null | undefined): string | null {
  switch (status) {
    case 'ok':
      return 'Incremental cursor continuity verified';
    case 'bootstrap':
      return 'Initial sync completed without a prior cursor';
    case 'full_rebuild':
      return 'Full rebuild completed; continuity reset from canonical fetch';
    case 'cursor_not_found':
      return 'Previous cursor was not found in fetched history';
    case 'page_limit_reached':
      return 'Previous cursor was not reached before max page limit';
    default:
      return null;
  }
}

export function describeWalletHistoryCoverageStatus(
  status: string | null | undefined,
): string | null {
  switch (status) {
    case 'complete':
      return 'Full history reached during the latest canonical fetch';
    case 'partial_page_limit':
      return 'History is exact but truncated at the configured page limit';
    case 'unknown':
      return 'History completeness could not be proven from the latest full fetch';
    default:
      return null;
  }
}

export function isContinuityRisk(status: string | null | undefined): boolean {
  return status === 'cursor_not_found' || status === 'page_limit_reached';
}

export function isHistoryCoverageGap(status: string | null | undefined): boolean {
  return status === 'partial_page_limit' || status === 'unknown';
}

export function shouldAutoRemediateWalletSync(input: {
  continuityStatus: string | null | undefined;
  warningCode: string | null | undefined;
}): boolean {
  return isContinuityRisk(input.continuityStatus) || input.warningCode != null;
}

function getWalletContinuityOutcome(input: {
  syncMode: WalletSyncMode;
  previousSignature: string | null;
  previousCursorFound: boolean | null;
  pageLimitReached: boolean;
}): { status: WalletContinuityStatus; issue: string | null } {
  if (input.syncMode !== 'incremental') {
    return { status: 'full_rebuild', issue: null };
  }

  if (!input.previousSignature) {
    return { status: 'bootstrap', issue: null };
  }

  if (input.previousCursorFound) {
    return { status: 'ok', issue: null };
  }

  if (input.pageLimitReached) {
    return {
      status: 'page_limit_reached',
      issue:
        'Previous cursor was not reached before the incremental page limit; older new trades may have been skipped.',
    };
  }

  return {
    status: 'cursor_not_found',
    issue:
      'Previous cursor was not found in fetched history; incremental continuity could not be proven.',
  };
}

function getWalletHistoryCoverageOutcome(input: {
  syncMode: WalletSyncMode;
  previousSignature: string | null;
  reachedHistoryEnd: boolean;
  pageLimitReached: boolean;
}):
  | {
      status: WalletHistoryCoverageStatus;
      issue: string | null;
      shouldPersist: true;
    }
  | {
      shouldPersist: false;
    } {
  const isCanonicalHistoryFetch =
    input.syncMode !== 'incremental' || input.previousSignature == null;

  if (!isCanonicalHistoryFetch) {
    return { shouldPersist: false };
  }

  if (input.reachedHistoryEnd) {
    return {
      shouldPersist: true,
      status: 'complete',
      issue: null,
    };
  }

  if (input.pageLimitReached) {
    return {
      shouldPersist: true,
      status: 'partial_page_limit',
      issue:
        'The latest full fetch stopped at the configured page limit; older historical trades may still exist beyond indexed history.',
    };
  }

  return {
    shouldPersist: true,
    status: 'unknown',
    issue:
      'History completeness could not be proven from the latest full fetch.',
  };
}

export async function recordWalletSyncSuccess(input: {
  walletId: string;
  syncMode: WalletSyncMode;
  attemptedAt?: Date;
  successfulAt?: Date;
  newestSignature: string | null;
  oldestFetchedSignature: string | null;
  previousSignature: string | null;
  txnsFetched: number;
  candidateTxCount: number;
  tradeRows: number;
  eventRows: number;
  pagesFetched: number;
  previousCursorFound: boolean | null;
  reachedHistoryEnd: boolean;
  pageLimitReached: boolean;
  oldestExactEventAt?: Date | null;
}): Promise<void> {
  const attemptedAt = input.attemptedAt ?? new Date();
  const successfulAt = input.successfulAt ?? attemptedAt;
  const warningCode = getWalletSyncWarningCode(input);
  const continuity = getWalletContinuityOutcome(input);
  const historyCoverage = getWalletHistoryCoverageOutcome(input);

  await prisma.wallet.update({
    where: { id: input.walletId },
    data: {
      lastSignature: input.txnsFetched > 0 ? input.newestSignature : input.previousSignature,
      lastFetchedAt: successfulAt,
      lastSyncAttemptAt: attemptedAt,
      lastSuccessfulSyncAt: successfulAt,
      lastSyncStatus: 'success',
      lastSyncError: null,
      lastSyncTxnsFetched: input.txnsFetched,
      lastSyncTradeRows: input.tradeRows,
      lastSyncEventRows: input.eventRows,
      syncWarningCode: warningCode,
      lastContinuityStatus: continuity.status,
      lastContinuityIssue: continuity.issue,
      ...(historyCoverage.shouldPersist
        ? {
            historyCoverageStatus: historyCoverage.status,
            historyCoverageIssue: historyCoverage.issue,
            historyCoverageUpdatedAt: successfulAt,
            oldestExactEventAt: input.oldestExactEventAt ?? null,
          }
        : {}),
    },
  });

  await prisma.walletSyncAudit.create({
    data: {
      walletId: input.walletId,
      syncMode: input.syncMode,
      status: 'success',
      attemptedAt,
      completedAt: successfulAt,
      previousSignature: input.previousSignature,
      newestSignature: input.newestSignature,
      oldestFetchedSignature: input.oldestFetchedSignature,
      txnsFetched: input.txnsFetched,
      tradeRows: input.tradeRows,
      eventRows: input.eventRows,
      pagesFetched: input.pagesFetched,
      previousCursorFound: input.previousCursorFound,
      reachedHistoryEnd: input.reachedHistoryEnd,
      pageLimitReached: input.pageLimitReached,
      continuityStatus: continuity.status,
      continuityIssue: continuity.issue,
      historyCoverageStatus: historyCoverage.shouldPersist ? historyCoverage.status : null,
      historyCoverageIssue: historyCoverage.shouldPersist ? historyCoverage.issue : null,
      oldestExactEventAt: historyCoverage.shouldPersist ? input.oldestExactEventAt ?? null : null,
      warningCode,
    },
  });
}

export async function recordWalletSyncFailure(input: {
  walletId: string;
  syncMode: WalletSyncMode;
  error: string;
  attemptedAt?: Date;
  previousSignature?: string | null;
}): Promise<void> {
  const attemptedAt = input.attemptedAt ?? new Date();

  await prisma.wallet.update({
    where: { id: input.walletId },
    data: {
      lastSyncAttemptAt: attemptedAt,
      lastSyncStatus: 'error',
      lastSyncError: input.error,
    },
  });

  await prisma.walletSyncAudit.create({
    data: {
      walletId: input.walletId,
      syncMode: input.syncMode,
      status: 'error',
      attemptedAt,
      previousSignature: input.previousSignature ?? null,
      error: input.error,
    },
  });
}

export interface WalletSyncAssessment {
  warningCode: WalletSyncWarningCode | null;
  continuityStatus: WalletContinuityStatus;
  continuityIssue: string | null;
}

export function assessWalletSync(input: {
  syncMode: WalletSyncMode;
  previousSignature: string | null;
  previousCursorFound: boolean | null;
  pageLimitReached: boolean;
  txnsFetched: number;
  candidateTxCount: number;
  tradeRows: number;
  eventRows: number;
}): WalletSyncAssessment {
  const continuity = getWalletContinuityOutcome(input);
  return {
    warningCode: getWalletSyncWarningCode(input),
    continuityStatus: continuity.status,
    continuityIssue: continuity.issue,
  };
}

export interface WalletSyncHealthIssue {
  address: string;
  username: string;
  lastSuccessfulSyncAt: string | null;
  lastSyncStatus: string | null;
  syncWarningCode: string | null;
  lastSyncError: string | null;
  lastContinuityStatus: string | null;
  lastContinuityIssue: string | null;
  historyCoverageStatus: string | null;
  historyCoverageIssue: string | null;
  oldestExactEventAt: string | null;
  tradeRows: number;
  eventRows: number;
}

export interface WalletSyncHealthReport {
  generatedAt: string;
  thresholds: {
    warningHours: number;
    criticalHours: number;
  };
  totals: {
    wallets: number;
    walletsNeverSynced: number;
    walletsHealthy: number;
    walletsWithErrors: number;
    walletsWithWarnings: number;
    walletsWithContinuityRisk: number;
    staleWarning: number;
    staleCritical: number;
    walletsWithAggregateTrades: number;
    walletsWithExactEvents: number;
    walletsMissingEventCoverage: number;
    exactCoverageRate: number;
    tradedWalletExactCoverageRate: number;
    walletsWithHistoryCoverageGap: number;
    walletsWithCompleteHistoryCoverage: number;
  };
  samples: {
    errors: WalletSyncHealthIssue[];
    warnings: WalletSyncHealthIssue[];
    continuityRisk: WalletSyncHealthIssue[];
    staleCritical: WalletSyncHealthIssue[];
    missingEventCoverage: WalletSyncHealthIssue[];
    historyCoverageGap: WalletSyncHealthIssue[];
  };
}

export async function getWalletSyncHealthReport(sampleSize: number = 10): Promise<WalletSyncHealthReport> {
  const wallets = await prisma.wallet.findMany({
    where: { address: { not: '' } },
    select: {
      address: true,
      lastSuccessfulSyncAt: true,
      lastSyncStatus: true,
      syncWarningCode: true,
      lastSyncError: true,
      lastContinuityStatus: true,
      lastContinuityIssue: true,
      historyCoverageStatus: true,
      historyCoverageIssue: true,
      oldestExactEventAt: true,
      user: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          trades: true,
          tradeEvents: true,
        },
      },
    },
    orderBy: { linkedAt: 'asc' },
  });

  const now = Date.now();
  const issueRows = wallets.map((wallet) => ({
    address: wallet.address,
    username: wallet.user.username,
    lastSuccessfulSyncAt: wallet.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastSyncStatus: wallet.lastSyncStatus,
    syncWarningCode: wallet.syncWarningCode,
    lastSyncError: wallet.lastSyncError,
    lastContinuityStatus: wallet.lastContinuityStatus,
    lastContinuityIssue: wallet.lastContinuityIssue,
    historyCoverageStatus: wallet.historyCoverageStatus,
    historyCoverageIssue: wallet.historyCoverageIssue,
    oldestExactEventAt: wallet.oldestExactEventAt?.toISOString() ?? null,
    tradeRows: wallet._count.trades,
    eventRows: wallet._count.tradeEvents,
    hoursSinceSuccess:
      wallet.lastSuccessfulSyncAt != null
        ? (now - wallet.lastSuccessfulSyncAt.getTime()) / 36e5
        : null,
  }));

  const walletsNeverSynced = issueRows.filter((wallet) => wallet.lastSuccessfulSyncAt == null);
  const walletsWithErrors = issueRows.filter((wallet) => wallet.lastSyncStatus === 'error');
  const walletsWithWarnings = issueRows.filter((wallet) => wallet.syncWarningCode != null);
  const continuityRisk = issueRows.filter((wallet) => isContinuityRisk(wallet.lastContinuityStatus));
  const staleWarning = issueRows.filter(
    (wallet) =>
      wallet.hoursSinceSuccess != null &&
      wallet.hoursSinceSuccess >= WALLET_SYNC_STALE_WARNING_HOURS,
  );
  const staleCritical = issueRows.filter(
    (wallet) =>
      wallet.hoursSinceSuccess != null &&
      wallet.hoursSinceSuccess >= WALLET_SYNC_STALE_CRITICAL_HOURS,
  );
  const walletsWithAggregateTrades = issueRows.filter((wallet) => wallet.tradeRows > 0);
  const walletsWithExactEvents = issueRows.filter((wallet) => wallet.eventRows > 0);
  const walletsMissingEventCoverage = issueRows.filter(
    (wallet) => wallet.tradeRows > 0 && wallet.eventRows === 0,
  );
  const walletsWithHistoryCoverageGap = issueRows.filter((wallet) =>
    isHistoryCoverageGap(wallet.historyCoverageStatus),
  );
  const walletsWithCompleteHistoryCoverage = issueRows.filter(
    (wallet) => wallet.historyCoverageStatus === 'complete',
  );
  const walletsHealthy = issueRows.filter(
    (wallet) =>
      wallet.lastSuccessfulSyncAt != null &&
      wallet.lastSyncStatus !== 'error' &&
      wallet.syncWarningCode == null &&
      !isContinuityRisk(wallet.lastContinuityStatus) &&
      (wallet.hoursSinceSuccess == null ||
        wallet.hoursSinceSuccess < WALLET_SYNC_STALE_WARNING_HOURS),
  );

  return {
    generatedAt: new Date().toISOString(),
    thresholds: {
      warningHours: WALLET_SYNC_STALE_WARNING_HOURS,
      criticalHours: WALLET_SYNC_STALE_CRITICAL_HOURS,
    },
    totals: {
      wallets: issueRows.length,
      walletsNeverSynced: walletsNeverSynced.length,
      walletsHealthy: walletsHealthy.length,
      walletsWithErrors: walletsWithErrors.length,
      walletsWithWarnings: walletsWithWarnings.length,
      walletsWithContinuityRisk: continuityRisk.length,
      staleWarning: staleWarning.length,
      staleCritical: staleCritical.length,
      walletsWithAggregateTrades: walletsWithAggregateTrades.length,
      walletsWithExactEvents: walletsWithExactEvents.length,
      walletsMissingEventCoverage: walletsMissingEventCoverage.length,
      exactCoverageRate:
        issueRows.length > 0 ? walletsWithExactEvents.length / issueRows.length : 0,
      tradedWalletExactCoverageRate:
        walletsWithAggregateTrades.length > 0
          ? walletsWithExactEvents.length / walletsWithAggregateTrades.length
          : 0,
      walletsWithHistoryCoverageGap: walletsWithHistoryCoverageGap.length,
      walletsWithCompleteHistoryCoverage: walletsWithCompleteHistoryCoverage.length,
    },
    samples: {
      errors: walletsWithErrors.slice(0, sampleSize),
      warnings: walletsWithWarnings.slice(0, sampleSize),
      continuityRisk: continuityRisk.slice(0, sampleSize),
      staleCritical: staleCritical.slice(0, sampleSize),
      missingEventCoverage: walletsMissingEventCoverage.slice(0, sampleSize),
      historyCoverageGap: walletsWithHistoryCoverageGap.slice(0, sampleSize),
    },
  };
}
