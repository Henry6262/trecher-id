import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { computeDegenScore } from '@/lib/degen-score';
import { ShareCardClient } from '@/components/share-card-client';
import { resolveAvatarUrl } from '@/lib/avatar-resolution';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — Web3Me Card`,
    robots: { index: false, follow: false },
    openGraph: {
      images: [`/${username}/opengraph-image`],
    },
  };
}

export default async function ShareCardPage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      wallets: true,
      pinnedTrades: { orderBy: { totalPnlSol: 'desc' }, take: 3 },
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
  const winRate = winRateCount > 0 ? totalWinRate / winRateCount : 0;
  const stats = { totalPnlUsd, winRate, totalTrades };

  const degenScore = computeDegenScore(
    {
      roi: 0,
      avgTradeSize: 0,
      bestTrade: null,
      worstTrade: null,
      winStreak: 0,
      avgHoldTime: '0m',
      consistency: 0,
      totalBuySol: 0,
      totalSellSol: 0,
    },
    { winRate, totalTrades, totalPnlUsd },
  );

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://web3me.fun'}/${username}`;
  const resolvedAvatarUrl = await resolveAvatarUrl({
    username: user.username,
    avatarUrl: user.avatarUrl,
  });

  return (
    <ShareCardClient
      user={{ username: user.username, displayName: user.displayName, avatarUrl: resolvedAvatarUrl }}
      stats={stats}
      degenScore={degenScore}
      pinnedTrades={user.pinnedTrades.map((t) => ({
        tokenSymbol: t.tokenSymbol,
        totalPnlPercent: t.totalPnlPercent,
      }))}
      shareUrl={shareUrl}
    />
  );
}
