import { prisma } from '../src/lib/prisma';
import { invalidatePublicProfileCache } from '../src/lib/profile';
import {
  rebuildWalletTradeData,
  type RebuildWalletTradeDataResult,
} from '../src/lib/wallet-trade-rebuild';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFlagValue(name: string): string | null {
  const directIndex = process.argv.findIndex((arg) => arg === name);
  if (directIndex !== -1) {
    return process.argv[directIndex + 1] ?? null;
  }

  const inlineArg = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return inlineArg ? inlineArg.slice(name.length + 1) : null;
}

function parsePositiveIntList(value: string | null): number[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((num) => Number.isFinite(num) && num > 0)
        .map((num) => Math.floor(num)),
    ),
  ).sort((a, b) => a - b);
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('rate limit')
    || message.includes('quota')
    || message.includes('fetch failed')
    || message.includes("can't reach database server")
    || message.includes('connection')
    || message.includes('timed out')
    || message.includes('timeout')
    || message.includes('unable to start a transaction')
    || message.includes('expired transaction')
  );
}

async function getSolPriceInline(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    if (!res.ok) throw new Error(`CoinGecko price API error: ${res.status}`);
    const data = await res.json();
    const price = data?.solana?.usd;
    if (typeof price !== 'number' || price <= 0) throw new Error('Invalid SOL price');
    return price;
  } catch {
    return 83;
  }
}

async function rebuildWalletWithRetries(
  wallet: {
    id: string;
    address: string;
    userId: string;
    user: { username: string };
  },
  solPrice: number,
  maxPages: number,
): Promise<RebuildWalletTradeDataResult> {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const rebuild = await rebuildWalletTradeData({
        walletId: wallet.id,
        walletAddress: wallet.address,
        userId: wallet.userId,
        solPrice,
        maxPages,
      });

      await invalidatePublicProfileCache(wallet.user.username);
      return rebuild;
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      await sleep(attempt * 3000);
    }
  }

  throw new Error(`Failed to rebuild wallet ${wallet.address}`);
}

async function main() {
  const targetWalletAddress = getFlagValue('--wallet');
  const maxPages = Number(getFlagValue('--max-pages') ?? '20');
  const pageSchedule = parsePositiveIntList(getFlagValue('--page-schedule'));
  const limit = Number(getFlagValue('--limit') ?? '0');
  const includeAllWallets = process.argv.includes('--all');
  const historyGapsOnly = process.argv.includes('--history-gaps-only');
  const tradedOnly = process.argv.includes('--traded-only');
  const historyStatus = getFlagValue('--history-status');
  const adaptiveUntilComplete = process.argv.includes('--adaptive-until-complete');
  const rebuildPagePlan = pageSchedule.length > 0 ? pageSchedule : [maxPages];
  const wallets = await prisma.wallet.findMany({
    where: {
      ...(targetWalletAddress ? { address: targetWalletAddress } : {}),
      ...(historyStatus ? { historyCoverageStatus: historyStatus } : {}),
      ...(historyGapsOnly
        ? { historyCoverageStatus: { in: ['partial_page_limit', 'unknown'] } }
        : {}),
      ...(tradedOnly ? { trades: { some: {} } } : {}),
      ...(!includeAllWallets && !historyGapsOnly && !historyStatus
        ? { tradeEvents: { none: {} } }
        : {}),
    },
    include: { user: true },
    orderBy: historyGapsOnly || historyStatus
      ? [
          { oldestExactEventAt: 'asc' },
          { historyCoverageUpdatedAt: 'asc' },
          { lastFetchedAt: 'asc' },
          { linkedAt: 'asc' },
        ]
      : [{ lastFetchedAt: 'asc' }, { linkedAt: 'asc' }],
    take: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : undefined,
  });

  if (wallets.length === 0) {
    console.log(
      JSON.stringify({
        ok: true,
        walletsProcessed: 0,
        eventRowsCreated: 0,
        targetWalletAddress,
        rebuildPagePlan,
        adaptiveUntilComplete,
        historyGapsOnly,
        tradedOnly,
        historyStatus,
      }),
    );
    await prisma.$disconnect();
    return;
  }

  const solPrice = await getSolPriceInline();
  const results: Array<{
    wallet: string;
    pagePlan: number[];
    pagesUsed: number;
    historyCoverageStatus: string | null;
    oldestExactEventAt: string | null;
    fetchedTransactions: number;
    tradeRows: number;
    eventRows: number;
  }> = [];
  const errors: Array<{ wallet: string; error: string }> = [];

  for (const wallet of wallets) {
    try {
      let finalRebuild: RebuildWalletTradeDataResult | null = null;
      let pagesUsed = rebuildPagePlan[0] ?? maxPages;
      let coverageStatus: string | null = null;
      let oldestExactEventAt: string | null = null;

      for (const plannedPages of rebuildPagePlan) {
        const rebuild = await rebuildWalletWithRetries(wallet, solPrice, plannedPages);
        finalRebuild = rebuild;
        pagesUsed = plannedPages;

        const refreshedWallet = await prisma.wallet.findUnique({
          where: { id: wallet.id },
          select: {
            historyCoverageStatus: true,
            oldestExactEventAt: true,
          },
        });
        coverageStatus = refreshedWallet?.historyCoverageStatus ?? null;
        oldestExactEventAt = refreshedWallet?.oldestExactEventAt?.toISOString() ?? null;

        if (!adaptiveUntilComplete || coverageStatus === 'complete') {
          break;
        }
      }

      if (!finalRebuild) {
        throw new Error(`No rebuild result was produced for wallet ${wallet.address}`);
      }

      results.push({
        wallet: wallet.address,
        pagePlan: rebuildPagePlan,
        pagesUsed,
        historyCoverageStatus: coverageStatus,
        oldestExactEventAt,
        fetchedTransactions: finalRebuild.fetchedTransactions,
        tradeRows: finalRebuild.tradeRows,
        eventRows: finalRebuild.eventRows,
      });

      console.log(
        JSON.stringify({
          wallet: wallet.address,
          pagePlan: rebuildPagePlan,
          pagesUsed,
          historyCoverageStatus: coverageStatus,
          oldestExactEventAt,
          fetchedTransactions: finalRebuild.fetchedTransactions,
          tradeRows: finalRebuild.tradeRows,
          eventRows: finalRebuild.eventRows,
        }),
      );
      await sleep(500);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ wallet: wallet.address, error: message });
      console.log(JSON.stringify({ wallet: wallet.address, error: message }));
      await sleep(1000);
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      walletsProcessed: results.length,
      errorCount: errors.length,
      targetWalletAddress,
      maxPages,
      rebuildPagePlan,
      adaptiveUntilComplete,
      historyGapsOnly,
      tradedOnly,
      historyStatus,
      totals: {
        fetchedTransactions: results.reduce((sum, row) => sum + row.fetchedTransactions, 0),
        tradeRows: results.reduce((sum, row) => sum + row.tradeRows, 0),
        eventRows: results.reduce((sum, row) => sum + row.eventRows, 0),
      },
      errors,
    }),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
