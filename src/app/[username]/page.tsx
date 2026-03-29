import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileCard } from '@/components/profile-card';
import { BackgroundLayer } from '@/components/background-layer';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
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

  let totalPnlUsd = 0;
  let totalWinRate = 0;
  let winRateCount = 0;
  let totalTrades = 0;
  for (const w of user.wallets) {
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

  const pinnedTrades = user.pinnedTrades.map((t) => ({
    id: t.id,
    tokenSymbol: t.tokenSymbol,
    tokenName: t.tokenName,
    totalPnlPercent: t.totalPnlPercent,
    transactions: t.transactions as { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[],
  }));

  return (
    <div className="min-h-screen relative">
      <BackgroundLayer />
      <div className="relative z-10 py-10 px-4">
        <ProfileCard
          user={{
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
          }}
          stats={stats}
          links={user.links.map((l) => ({ id: l.id, title: l.title, url: l.url, icon: l.icon }))}
          pinnedTrades={pinnedTrades}
          wallets={user.wallets.map((w) => ({ address: w.address, verified: w.verified }))}
        />
      </div>
    </div>
  );
}
