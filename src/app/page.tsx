import { prisma } from '@/lib/prisma';
import { LandingContent } from '@/components/landing-content';
import { hasStrongAvatarUrl } from '@/lib/images';
import { formatPnl } from '@/lib/utils';
import { cached } from '@/lib/redis';
import { resolveAvatarRows } from '@/lib/avatar-resolution';
import type { TickerItem } from '@/lib/types';
import { SynapticBackgroundLayer } from '@/components/synaptic-background-layer';

export const dynamic = 'force-dynamic';

function isSyntheticLandingUser(username: string) {
  return (
    username === 'dev-bot' ||
    username.startsWith('dev_') ||
    username.startsWith('dev-') ||
    username.includes('_axiom') ||
    username.includes('_trader')
  );
}

function pickLandingGalleryUsernames(
  rankings: { username: string; avatarUrl: string | null }[],
) {
  const primary = rankings.filter((entry) => !isSyntheticLandingUser(entry.username) && hasStrongAvatarUrl(entry.avatarUrl));
  const secondary = rankings.filter((entry) => !primary.some((picked) => picked.username === entry.username));
  return [...primary, ...secondary].map((entry) => entry.username);
}

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref: refCode } = await searchParams;
  let traders: {
    username: string;
    name: string;
    avatarUrl: string | null;
    pnl: string;
    pnlValue: number;
    winRate: string;
    winRateValue: number;
    trades: string;
    tradeCount: number;
    isDeployer: boolean;
    topTrades: {
      id: string;
      token: string;
      tokenMint: string | null;
      tokenImage: string | null;
      pnlPercent: string;
      pnlPercentValue: number;
      buy: string | null;
      sell: string | null;
    }[];
    topDeployments: {
      id: string;
      tokenSymbol: string;
      tokenImageUrl: string | null;
      status: string;
      mcapAthUsd: number | null;
      devPnlSol: number | null;
    }[];
  }[] = [];
  let ticker: TickerItem[] = [];
  let leaderboardData: { rank: number; username: string; displayName: string; avatarUrl: string | null; isClaimed: boolean; pnlUsd: number; pnlSol: number; winRate: number; trades: number }[] = [];

  try {
  // Fetch ticker items directly (no internal HTTP — same Prisma call as /api/ticker)
  ticker = await cached<TickerItem[]>('ticker:recent', 60, async () => {
    const rows = await prisma.pinnedTrade.findMany({
      orderBy: { pinnedAt: 'desc' },
      take: 20,
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
    return rows.map((r) => ({
      username: r.user.username,
      avatarUrl: r.user.avatarUrl,
      tokenSymbol: r.tokenSymbol,
      pnlPercent: r.totalPnlPercent,
      totalPnlSol: r.totalPnlSol,
      pinnedAt: r.pinnedAt.toISOString(),
    }));
  });

  // Fetch leaderboard server-side for instant render
  const rankedRows = await prisma.userRanking.findMany({
    where: { period: '7d', trades: { gt: 0 }, rank: { not: null } },
    orderBy: { rank: 'asc' },
    include: { user: { select: { username: true, displayName: true, avatarUrl: true, isClaimed: true } } },
  });
  const rankings = rankedRows.length > 0
    ? rankedRows
    : await prisma.userRanking.findMany({
        where: { period: '7d', trades: { gt: 0 } },
        orderBy: [
          { pnlUsd: 'desc' },
          { winRate: 'desc' },
          { trades: 'desc' },
          { userId: 'asc' },
        ],
        include: { user: { select: { username: true, displayName: true, avatarUrl: true, isClaimed: true } } },
      });
  leaderboardData = await resolveAvatarRows(rankings.map((r, i) => ({
    rank: r.rank ?? (i + 1),
    username: r.user.username,
    displayName: r.user.displayName,
    avatarUrl: r.user.avatarUrl,
    isClaimed: r.user.isClaimed,
    pnlUsd: r.pnlUsd,
    pnlSol: r.pnlSol,
    winRate: r.winRate,
    trades: r.trades,
  })));

  const rankedUsernames = pickLandingGalleryUsernames(leaderboardData);
  
  // Filter for traders with positive PnL and real activity for hero section
  const heroUsernames = rankedUsernames.filter(username => {
    const ranking = leaderboardData.find(r => r.username === username);
    return ranking && ranking.pnlUsd > 0 && ranking.trades >= 10;
  });

  // MOCK TRADERS - Ensure Hero always has high-quality content even if DB is empty
  const mockTraders = [
    {
      username: 'trench_master',
      name: 'Trench Master',
      avatarUrl: null,
      pnl: '+$42,850',
      pnlValue: 42850,
      winRate: '72%',
      winRateValue: 72,
      trades: '156',
      tradeCount: 156,
      topTrades: [
        { id: '1', token: 'SOL', tokenMint: null, tokenImage: null, pnlPercent: '+120%', pnlPercentValue: 120, buy: '10.5', sell: '23.1' }
      ]
    },
    {
      username: 'alpha_dog',
      name: 'Alpha Dog',
      avatarUrl: null,
      pnl: '+$18,200',
      pnlValue: 18200,
      winRate: '64%',
      winRateValue: 64,
      trades: '89',
      tradeCount: 89,
      topTrades: [
        { id: '2', token: 'BONK', tokenMint: null, tokenImage: null, pnlPercent: '+85%', pnlPercentValue: 85, buy: '5.2', sell: '9.6' }
      ]
    },
    {
      username: 'deep_value',
      name: 'Deep Value',
      avatarUrl: null,
      pnl: '+$9,420',
      pnlValue: 9420,
      winRate: '58%',
      winRateValue: 58,
      trades: '214',
      tradeCount: 214,
      topTrades: [
        { id: '3', token: 'WIF', tokenMint: null, tokenImage: null, pnlPercent: '+42%', pnlPercentValue: 42, buy: '25.0', sell: '35.5' }
      ]
    }
  ];
  
  const users = rankedUsernames.length > 0
    ? await prisma.user.findMany({
        where: { username: { in: rankedUsernames } },
        include: {
          wallets: true,
          pinnedTrades: { orderBy: [{ totalPnlPercent: 'desc' }, { totalPnlSol: 'desc' }], take: 3 },
          tokenDeployments: { orderBy: { mcapAthUsd: 'desc' }, take: 3 },
        },
      })
    : [];

  const tokenImageRows = rankedUsernames.length > 0
    ? await prisma.walletTrade.findMany({
        where: {
          wallet: { user: { username: { in: rankedUsernames } } },
          tokenImageUrl: { not: null },
        },
        select: {
          tokenMint: true,
          tokenSymbol: true,
          tokenImageUrl: true,
          wallet: { select: { user: { select: { username: true } } } },
        },
      })
    : [];

  const usersWithResolvedAvatars = await resolveAvatarRows(users);
  const userByUsername = new Map(usersWithResolvedAvatars.map((user) => [user.username, user]));
  const tradeImageByUserAndMint = new Map(
    tokenImageRows.map((row) => [`${row.wallet.user.username}:${row.tokenMint}`, row.tokenImageUrl]),
  );
  const tradeImageByUserAndSymbol = new Map(
    tokenImageRows.map((row) => [`${row.wallet.user.username}:${row.tokenSymbol}`, row.tokenImageUrl]),
  );
  traders = rankedUsernames
    .map((username) => {
      const user = userByUsername.get(username);
      const ranking = leaderboardData.find((entry) => entry.username === username);
      if (!user || !ranking) return null;

      return {
        username: user.username,
        name: user.displayName,
        avatarUrl: user.avatarUrl,
        pnl: formatPnl(ranking.pnlUsd),
        pnlValue: ranking.pnlUsd,
        winRate: `${ranking.winRate.toFixed(0)}%`,
        winRateValue: ranking.winRate,
        trades: String(ranking.trades),
        tradeCount: ranking.trades,
        topTrades: user.pinnedTrades.map((trade) => {
          const transactions = trade.transactions as { type: string; amountSol: number }[] | undefined;
          const totalBuy = transactions?.filter(t => t.type === 'BUY').reduce((sum, t) => sum + t.amountSol, 0) ?? 0;
          const totalSell = transactions?.filter(t => t.type === 'SELL').reduce((sum, t) => sum + t.amountSol, 0) ?? 0;

          const resolvedTokenImage =
            trade.tokenImageUrl
            ?? tradeImageByUserAndMint.get(`${user.username}:${trade.tokenMint}`)
            ?? tradeImageByUserAndSymbol.get(`${user.username}:${trade.tokenSymbol}`)
            ?? null;
          return {
            id: trade.id,
            token: trade.tokenSymbol,
            tokenMint: trade.tokenMint,
            tokenImage: resolvedTokenImage,
            pnlPercent: trade.totalPnlPercent !== null
              ? `${trade.totalPnlPercent >= 0 ? '+' : ''}${trade.totalPnlPercent.toFixed(0)}%`
              : `${trade.totalPnlSol >= 0 ? '+' : ''}${trade.totalPnlSol.toFixed(1)} SOL`,
            pnlPercentValue: trade.totalPnlPercent ?? trade.totalPnlSol,
            buy: totalBuy > 0 ? totalBuy.toFixed(1) : null,
            sell: totalSell > 0 ? totalSell.toFixed(1) : null,
          };
        }),
        topDeployments: user.tokenDeployments.map((dep) => ({
          id: dep.id,
          tokenSymbol: dep.tokenSymbol,
          tokenImageUrl: dep.tokenImageUrl ?? null,
          status: dep.status,
          mcapAthUsd: dep.mcapAthUsd ?? null,
          devPnlSol: dep.devPnlSol ?? null,
        })),
        isDeployer: user.tokenDeployments.length >= 5 && user.tokenDeployments.length > user.pinnedTrades.length,
      };
    })
    .filter((trader): trader is NonNullable<typeof trader> => trader !== null);

  } catch (err) {
    console.error('[landing] SSR error:', err);
  }

  const featuredProfiles = traders.filter((trader) => 
    trader.pnlValue > 0 && 
    trader.topTrades.length > 0 && 
    !trader.isDeployer &&
    !isSyntheticLandingUser(trader.username)
  ).slice(0, 3);
  
  // Combine real profiles with mock ones to ensure we always have 3 for the Hero
  const displayHeroProfiles = featuredProfiles.length >= 3 
    ? featuredProfiles 
    : [...featuredProfiles, ...mockTraders as any].slice(0, 3);

  return (
    <div className="min-h-screen relative" style={{ background: 'transparent' }}>
      <SynapticBackgroundLayer />
      <div className="relative" style={{ zIndex: 1 }}>
        <LandingContent
          traders={traders}
          featuredProfiles={displayHeroProfiles}
          ticker={ticker}
          leaderboardData={leaderboardData}
          refCode={refCode}
        />
      </div>
    </div>
  );
}
