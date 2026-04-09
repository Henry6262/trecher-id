import { prisma } from '../src/lib/prisma';
import {
  getWalletSyncWarningCode,
} from '../src/lib/wallet-sync-health';

function deriveHistoryCoverage(input: {
  reachedHistoryEnd: boolean | null;
  pageLimitReached: boolean | null;
}): {
  status: 'complete' | 'partial_page_limit' | 'unknown';
  issue: string | null;
} {
  if (input.reachedHistoryEnd) {
    return { status: 'complete', issue: null };
  }

  if (input.pageLimitReached) {
    return {
      status: 'partial_page_limit',
      issue:
        'The latest full fetch stopped at the configured page limit; older historical trades may still exist beyond indexed history.',
    };
  }

  return {
    status: 'unknown',
    issue: 'History completeness could not be proven from the latest full fetch.',
  };
}

async function main() {
  const wallets = await prisma.wallet.findMany({
    select: {
      id: true,
      address: true,
      lastFetchedAt: true,
      lastSuccessfulSyncAt: true,
      lastSyncStatus: true,
      _count: {
        select: {
          trades: true,
          tradeEvents: true,
          syncAudits: true,
        },
      },
    },
    orderBy: { linkedAt: 'asc' },
  });

  let updated = 0;

  for (const wallet of wallets) {
    const tradeRows = wallet._count.trades;
    const eventRows = wallet._count.tradeEvents;
    const warningCode = getWalletSyncWarningCode({
      txnsFetched: 0,
      candidateTxCount: 0,
      tradeRows,
      eventRows,
    });
    const [latestCanonicalAudit, oldestExactEvent] = await Promise.all([
      prisma.walletSyncAudit.findFirst({
        where: {
          walletId: wallet.id,
          status: 'success',
          OR: [
            { syncMode: { not: 'incremental' } },
            { previousSignature: null },
          ],
        },
        select: {
          completedAt: true,
          reachedHistoryEnd: true,
          pageLimitReached: true,
        },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      eventRows > 0
        ? prisma.walletTradeEvent.findFirst({
            where: { walletId: wallet.id },
            select: { timestamp: true },
            orderBy: { timestamp: 'asc' },
          })
        : Promise.resolve(null),
    ]);
    const historyCoverage = latestCanonicalAudit
      ? deriveHistoryCoverage({
          reachedHistoryEnd: latestCanonicalAudit.reachedHistoryEnd,
          pageLimitReached: latestCanonicalAudit.pageLimitReached,
        })
      : null;

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        lastSyncAttemptAt: wallet.lastFetchedAt ?? wallet.lastSuccessfulSyncAt ?? null,
        lastSuccessfulSyncAt: wallet.lastSuccessfulSyncAt ?? wallet.lastFetchedAt ?? null,
        lastSyncStatus:
          wallet.lastSyncStatus ?? (wallet.lastFetchedAt != null ? 'success' : null),
        lastSyncTradeRows: tradeRows,
        lastSyncEventRows: eventRows,
        syncWarningCode: warningCode,
        lastContinuityStatus: wallet.lastFetchedAt != null ? 'full_rebuild' : null,
        lastContinuityIssue: null,
        historyCoverageStatus: historyCoverage?.status ?? null,
        historyCoverageIssue: historyCoverage?.issue ?? null,
        historyCoverageUpdatedAt: latestCanonicalAudit?.completedAt ?? null,
        oldestExactEventAt: oldestExactEvent?.timestamp ?? null,
      },
    });

    if (wallet._count.syncAudits === 0 && wallet.lastFetchedAt != null) {
      await prisma.walletSyncAudit.create({
        data: {
          walletId: wallet.id,
          syncMode: 'backfill',
          status: 'success',
          attemptedAt: wallet.lastFetchedAt,
          completedAt: wallet.lastFetchedAt,
          txnsFetched: 0,
          tradeRows,
          eventRows,
          pagesFetched: 0,
          continuityStatus: 'full_rebuild',
          historyCoverageStatus: 'unknown',
          historyCoverageIssue: 'History completeness could not be proven from the bootstrap backfill.',
          warningCode,
        },
      });
    }

    updated += 1;
  }

  console.log(JSON.stringify({ ok: true, walletsUpdated: updated }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
