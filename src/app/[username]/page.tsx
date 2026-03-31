import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileCard } from '@/components/profile-card';
import { BackgroundLayer } from '@/components/background-layer';
import { getWalletTransactions, aggregateTradesByToken } from '@/lib/helius';
import { computeTraderStats } from '@/lib/trade-stats';
import { cached } from '@/lib/redis';
import type { DeploymentData } from '@/components/deployment-carousel';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
}

interface DBWallet {
  address: string;
  verified: boolean;
  isMain: boolean;
  totalPnlUsd: number | null;
  winRate: number | null;
  totalTrades: number | null;
}

interface DBLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
}

interface DBPinnedTrade {
  id: string;
  tokenSymbol: string;
  tokenName: string | null;
  tokenImageUrl: string | null;
  totalPnlPercent: number;
  totalPnlSol: number;
  transactions: unknown;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: { wallets: true },
  });
  if (!user) return { title: 'Not Found' };

  let totalPnlUsd = 0;
  let totalWinRate = 0;
  let winRateCount = 0;
  let totalTrades = 0;
  for (const w of user.wallets) {
    totalPnlUsd += w.totalPnlUsd ?? 0;
    totalTrades += w.totalTrades ?? 0;
    if (w.winRate != null) { totalWinRate += w.winRate; winRateCount++; }
  }
  const winRate = winRateCount > 0 ? totalWinRate / winRateCount : 0;
  const pnlStr = totalPnlUsd >= 1000
    ? `$${(totalPnlUsd / 1000).toFixed(1)}K`
    : `$${totalPnlUsd.toFixed(0)}`;

  const description = `${pnlStr} PnL · ${winRate.toFixed(0)}% Win Rate · ${totalTrades} Trades${user.bio ? ` — ${user.bio}` : ''}`;
  const title = `@${username} — Trench ID`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/${username}`,
      siteName: 'Trench ID',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: { orderBy: { order: 'asc' } },
      wallets: { orderBy: { linkedAt: 'asc' } },
      pinnedTrades: { orderBy: { order: 'asc' } },
      tokenDeployments: { orderBy: { deployedAt: 'desc' } },
    },
  });
  if (!user) notFound();

  const wallets: DBWallet[] = user.wallets;
  const links: DBLink[] = user.links;
  const trades: DBPinnedTrade[] = user.pinnedTrades;

  let totalPnlUsd = 0;
  let totalWinRate = 0;
  let winRateCount = 0;
  let totalTrades = 0;
  for (const w of wallets) {
    totalPnlUsd += w.totalPnlUsd ?? 0;
    totalTrades += w.totalTrades ?? 0;
    if (w.winRate != null) {
      totalWinRate += w.winRate;
      winRateCount++;
    }
  }
  const stats = {
    totalPnlUsd,
    winRate: winRateCount > 0 ? totalWinRate / winRateCount : 0,
    totalTrades,
  };

  // Fetch on-chain trades for all wallets and compute advanced stats
  const allTrades = await cached(
    `trader-stats:${user.id}`,
    300, // 5 min TTL
    async () => {
      const results = await Promise.all(
        wallets.map(async (w: DBWallet) => {
          try {
            const txns = await getWalletTransactions(w.address);
            return aggregateTradesByToken(txns, w.address, 7);
          } catch {
            return [];
          }
        }),
      );
      return results.flat();
    },
  );
  const traderStats = computeTraderStats(allTrades);

  const deployments: DeploymentData[] = user.tokenDeployments.map((d) => ({
    id: d.id,
    tokenSymbol: d.tokenSymbol,
    tokenName: d.tokenName,
    tokenImageUrl: d.tokenImageUrl,
    platform: d.platform,
    status: d.status,
    mcapAthUsd: d.mcapAthUsd,
    holders: d.holders,
    volumeUsd: d.volumeUsd,
    devPnlSol: d.devPnlSol,
    devPnlUsd: d.devPnlUsd,
    deployedAt: d.deployedAt.toISOString(),
  }));

  const pinnedTrades = trades.map((t: DBPinnedTrade) => ({
    id: t.id,
    tokenSymbol: t.tokenSymbol,
    tokenName: t.tokenName,
    tokenImage: t.tokenImageUrl,
    totalPnlPercent: t.totalPnlPercent,
    totalPnlSol: t.totalPnlSol,
    transactions: t.transactions as { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[],
  }));

  return (
    <div className="min-h-screen relative" style={{ background: 'transparent' }}>
      <BackgroundLayer />
      <div className="relative py-10 px-4" style={{ zIndex: 1 }}>
        <ProfileCard
          user={{
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
          }}
          stats={stats}
          links={links.map((l: DBLink) => ({ id: l.id, title: l.title, url: l.url, icon: l.icon }))}
          pinnedTrades={pinnedTrades}
          traderStats={traderStats}
          wallets={wallets.map((w: DBWallet) => ({ address: w.address, verified: w.verified, isMain: w.isMain }))}
          deployments={deployments}
        />
      </div>
    </div>
  );
}
