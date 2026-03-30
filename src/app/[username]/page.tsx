import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileCard } from '@/components/profile-card';
import { BackgroundLayer } from '@/components/background-layer';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
}

interface DBWallet {
  address: string;
  verified: boolean;
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
    select: { displayName: true, bio: true },
  });
  if (!user) return { title: 'Not Found' };
  return {
    title: `@${username} — Trench ID`,
    description: user.bio ?? `${user.displayName}'s Web3 bio link`,
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
          wallets={wallets.map((w: DBWallet) => ({ address: w.address, verified: w.verified }))}
        />
      </div>
    </div>
  );
}
