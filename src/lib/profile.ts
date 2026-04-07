import type { Metadata } from 'next';
import type { TokenTrade } from './helius';
import type { DegenScoreResult } from './degen-score';
import type { TraderStats } from './trade-stats';
import { prisma } from './prisma';
import { computeTraderStats } from './trade-stats';
import { computeDegenScore } from './degen-score';
import { cachedWithStale, invalidateCache } from './redis';

const PROFILE_CACHE_VERSION = 'v2';
const PROFILE_CACHE_FRESH_TTL_SECONDS = 120;
const PROFILE_CACHE_STALE_TTL_SECONDS = 900;

interface ProfileWalletRow {
  address: string;
  verified: boolean;
  isMain: boolean;
  totalPnlUsd: number | null;
  winRate: number | null;
  totalTrades: number | null;
}

interface WalletTradeRow {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string | null;
  tokenImageUrl: string | null;
  buySol: number;
  sellSol: number;
  pnlSol: number;
  tradeCount: number;
  firstTradeAt: Date;
  lastTradeAt: Date;
}

export interface PublicProfileData {
  user: {
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    isClaimed: boolean;
  };
  accentColor: string | null;
  bannerUrl: string | null;
  followerCount: number | null;
  stats: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  links: {
    id: string;
    title: string;
    url: string;
    icon: string | null;
  }[];
  wallets: {
    address: string;
    verified: boolean;
    isMain: boolean;
  }[];
  pinnedTrades: {
    id: string;
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string | null;
    tokenImage: string | null;
    totalPnlPercent: number;
    totalPnlSol: number;
    transactions: { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[];
  }[];
  deployments: {
    id: string;
    tokenSymbol: string;
    tokenName: string | null;
    tokenImageUrl: string | null;
    platform: string;
    status: string;
    mcapAthUsd: number | null;
    holders: number | null;
    volumeUsd: number | null;
    devPnlSol: number | null;
    devPnlUsd: number | null;
    deployedAt: string;
  }[];
  allTrades: TokenTrade[];
  traderStats: TraderStats;
  degenScore: DegenScoreResult;
}

function getProfileCacheKey(username: string): string {
  return `profile:public:${PROFILE_CACHE_VERSION}:${username.toLowerCase()}`;
}

function buildStats(wallets: ProfileWalletRow[]) {
  let totalPnlUsd = 0;
  let totalWinRate = 0;
  let winRateCount = 0;
  let totalTrades = 0;

  for (const wallet of wallets) {
    totalPnlUsd += wallet.totalPnlUsd ?? 0;
    totalTrades += wallet.totalTrades ?? 0;
    if (wallet.winRate != null) {
      totalWinRate += wallet.winRate;
      winRateCount++;
    }
  }

  return {
    totalPnlUsd,
    winRate: winRateCount > 0 ? totalWinRate / winRateCount : 0,
    totalTrades,
  };
}

function distributeAmount(total: number, count: number): number[] {
  if (count <= 0 || total <= 0) return [];

  const base = total / count;
  const parts = Array.from({ length: count }, () => base);
  const rounded = parts.map((part) => Math.round(part * 1_000_000) / 1_000_000);
  const delta = Math.round((total - rounded.reduce((sum, value) => sum + value, 0)) * 1_000_000) / 1_000_000;

  if (rounded.length > 0) {
    rounded[rounded.length - 1] = Math.max(0, rounded[rounded.length - 1] + delta);
  }

  return rounded;
}

function buildSyntheticTransactions(trade: WalletTradeRow): TokenTrade['transactions'] {
  const start = Math.floor(trade.firstTradeAt.getTime() / 1000);
  const end = Math.max(start, Math.floor(trade.lastTradeAt.getTime() / 1000));
  const totalCount = Math.max(1, Math.min(Math.max(trade.tradeCount, 2), 28));
  const hasBuys = trade.buySol > 0;
  const hasSells = trade.sellSol > 0;

  let buyCount = hasBuys ? 1 : 0;
  let sellCount = hasSells ? 1 : 0;

  if (hasBuys && hasSells) {
    buyCount = Math.max(1, Math.floor(totalCount / 2));
    sellCount = Math.max(1, totalCount - buyCount);
  } else if (hasBuys) {
    buyCount = totalCount;
  } else if (hasSells) {
    sellCount = totalCount;
  }

  const buyAmounts = distributeAmount(trade.buySol, buyCount);
  const sellAmounts = distributeAmount(trade.sellSol, sellCount);
  const transactions: TokenTrade['transactions'] = [];

  const buySpan = hasBuys && hasSells ? Math.max(0, Math.floor((end - start) * 0.45)) : end - start;
  const sellStart = hasBuys && hasSells ? Math.max(start, end - Math.max(0, Math.floor((end - start) * 0.45))) : start;
  const sellSpan = Math.max(0, end - sellStart);

  for (let i = 0; i < buyAmounts.length; i++) {
    const timestamp = buyAmounts.length === 1
      ? start
      : start + Math.floor((buySpan * i) / (buyAmounts.length - 1));
    transactions.push({
      type: 'BUY',
      amountSol: buyAmounts[i],
      mcap: 0,
      timestamp,
    });
  }

  for (let i = 0; i < sellAmounts.length; i++) {
    const timestamp = sellAmounts.length === 1
      ? end
      : sellStart + Math.floor((sellSpan * i) / (sellAmounts.length - 1));
    transactions.push({
      type: 'SELL',
      amountSol: sellAmounts[i],
      mcap: 0,
      timestamp,
    });
  }

  return transactions.sort((a, b) => a.timestamp - b.timestamp);
}

function walletTradeToTokenTrade(trade: WalletTradeRow): TokenTrade | null {
  const transactions = buildSyntheticTransactions(trade);

  if (transactions.length === 0) return null;

  const totalPnlPercent = trade.buySol > 0.001
    ? ((trade.sellSol - trade.buySol) / trade.buySol) * 100
    : 0;

  return {
    tokenMint: trade.tokenMint,
    tokenSymbol: trade.tokenSymbol || trade.tokenMint.slice(0, 6),
    tokenName: trade.tokenName ?? '',
    tokenImage: trade.tokenImageUrl,
    transactions,
    totalPnlSol: trade.pnlSol,
    totalPnlPercent,
  };
}

async function buildPublicProfileData(username: string): Promise<PublicProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      isClaimed: true,
      accentColor: true,
      bannerUrl: true,
      followerCount: true,
      links: {
        select: { id: true, title: true, url: true, icon: true },
        orderBy: { order: 'asc' },
      },
      wallets: {
        select: {
          id: true,
          address: true,
          verified: true,
          isMain: true,
          totalPnlUsd: true,
          winRate: true,
          totalTrades: true,
        },
        orderBy: { linkedAt: 'asc' },
      },
      pinnedTrades: {
        select: {
          id: true,
          tokenMint: true,
          tokenSymbol: true,
          tokenName: true,
          tokenImageUrl: true,
          totalPnlPercent: true,
          totalPnlSol: true,
          transactions: true,
        },
        orderBy: { order: 'asc' },
      },
      tokenDeployments: {
        select: {
          id: true,
          tokenSymbol: true,
          tokenName: true,
          tokenImageUrl: true,
          platform: true,
          status: true,
          mcapAthUsd: true,
          holders: true,
          volumeUsd: true,
          devPnlSol: true,
          devPnlUsd: true,
          deployedAt: true,
        },
        orderBy: { deployedAt: 'desc' },
      },
    },
  });

  if (!user) return null;

  const walletIds = user.wallets.map((wallet) => wallet.id);
  const walletTrades = walletIds.length > 0
    ? await prisma.walletTrade.findMany({
        where: { walletId: { in: walletIds } },
        select: {
          tokenMint: true,
          tokenSymbol: true,
          tokenName: true,
          tokenImageUrl: true,
          buySol: true,
          sellSol: true,
          pnlSol: true,
          tradeCount: true,
          firstTradeAt: true,
          lastTradeAt: true,
        },
        orderBy: { lastTradeAt: 'desc' },
      })
    : [];

  const stats = buildStats(user.wallets);
  const allTrades = walletTrades
    .map(walletTradeToTokenTrade)
    .filter((trade): trade is TokenTrade => trade !== null)
    .sort((a, b) => b.totalPnlSol - a.totalPnlSol);
  const traderStats = computeTraderStats(allTrades);
  const degenScore = computeDegenScore(traderStats, stats);

  return {
    user: {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isClaimed: user.isClaimed,
    },
    accentColor: user.accentColor,
    bannerUrl: user.bannerUrl,
    followerCount: user.followerCount,
    stats,
    links: user.links,
    wallets: user.wallets.map((wallet) => ({
      address: wallet.address,
      verified: wallet.verified,
      isMain: wallet.isMain,
    })),
    pinnedTrades: user.pinnedTrades.map((trade) => ({
      id: trade.id,
      tokenMint: trade.tokenMint,
      tokenSymbol: trade.tokenSymbol,
      tokenName: trade.tokenName,
      tokenImage: trade.tokenImageUrl,
      totalPnlPercent: trade.totalPnlPercent,
      totalPnlSol: trade.totalPnlSol,
      transactions: trade.transactions as {
        type: 'BUY' | 'SELL';
        mcap: number;
        amountSol: number;
      }[],
    })),
    deployments: user.tokenDeployments.map((deployment) => ({
      id: deployment.id,
      tokenSymbol: deployment.tokenSymbol,
      tokenName: deployment.tokenName,
      tokenImageUrl: deployment.tokenImageUrl,
      platform: deployment.platform,
      status: deployment.status,
      mcapAthUsd: deployment.mcapAthUsd,
      holders: deployment.holders,
      volumeUsd: deployment.volumeUsd,
      devPnlSol: deployment.devPnlSol,
      devPnlUsd: deployment.devPnlUsd,
      deployedAt: deployment.deployedAt.toISOString(),
    })),
    allTrades,
    traderStats,
    degenScore,
  };
}

function formatPnl(totalPnlUsd: number): string {
  if (totalPnlUsd >= 1000) {
    return `$${(totalPnlUsd / 1000).toFixed(1)}K`;
  }

  return `$${totalPnlUsd.toFixed(0)}`;
}

export function buildProfileMetadata(profile: PublicProfileData): Metadata {
  const description = `${formatPnl(profile.stats.totalPnlUsd)} PnL · ${profile.stats.winRate.toFixed(0)}% Win Rate · ${profile.stats.totalTrades} Trades${profile.user.bio ? ` — ${profile.user.bio}` : ''}`;
  const title = `@${profile.user.username} — Web3Me`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/${profile.user.username}`,
      siteName: 'Web3Me',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export async function getPublicProfileData(username: string): Promise<PublicProfileData | null> {
  return cachedWithStale(
    getProfileCacheKey(username),
    PROFILE_CACHE_FRESH_TTL_SECONDS,
    PROFILE_CACHE_STALE_TTL_SECONDS,
    () => buildPublicProfileData(username),
  );
}

export async function invalidatePublicProfileCache(username: string): Promise<void> {
  await invalidateCache(getProfileCacheKey(username));
}
