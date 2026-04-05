import Image from 'next/image';
import Link from 'next/link';
import { ProfileHeader } from './profile-header';
import { LinkItem } from './link-item';
import { TradeCarousel } from './trade-carousel';
import { DeploymentCarousel } from './deployment-carousel';
import type { DeploymentData } from './deployment-carousel';
import { CutCorner } from './cut-corner';
import { EnhancedStats } from './enhanced-stats';
import { TrophyCase } from './trophy-case';
import { TradeCalendar } from './trade-calendar';
import type { TraderStats } from '@/lib/trade-stats';
import type { TokenTrade } from '@/lib/helius';
import { computeDegenScore } from '@/lib/degen-score';
import type { DegenScoreResult } from '@/lib/degen-score';
import { computeAchievements } from '@/lib/achievements';
import { buildTradeCalendar } from '@/lib/trade-calendar';
import { PnlChart } from './pnl-chart';
import { PortfolioView } from './portfolio-view';

interface ProfileCardProps {
  user: {
    username: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
    isClaimed?: boolean;
  };
  stats: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  links: { id: string; title: string; url: string; icon?: string | null }[];
  pinnedTrades: {
    id: string;
    tokenMint?: string;
    tokenSymbol: string;
    tokenName?: string | null;
    tokenImage?: string | null;
    totalPnlPercent: number;
    totalPnlSol?: number;
    transactions: { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[];
  }[];
  wallets: { address: string; verified: boolean; isMain?: boolean }[];
  traderStats?: TraderStats;
  deployments?: DeploymentData[];
  allTrades?: TokenTrade[];
  degenScore?: DegenScoreResult;
  followerCount?: number | null;
  isOwner?: boolean;
  accentColor?: string | null;
  bannerUrl?: string | null;
}

export function ProfileCard({ user, stats, links, pinnedTrades, wallets, traderStats, deployments, allTrades, degenScore, followerCount, isOwner, accentColor, bannerUrl }: ProfileCardProps) {
  const hasWallets = wallets.length > 0;

  // Compute achievements when we have enough data
  const achievements = traderStats && degenScore
    ? computeAchievements(stats, traderStats, degenScore)
    : [];

  // Build calendar from on-chain trade data if available
  const calendarWeeks = allTrades && allTrades.length > 0
    ? buildTradeCalendar(allTrades)
    : [];

  const accent = accentColor || '#00D4FF';

  return (
    <div className="w-full max-w-[620px] mx-auto" style={{ '--profile-accent': accent } as React.CSSProperties}>
      {/* Logo — links to landing page */}
      <div className="flex justify-center pt-0 pb-3">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/logo.png"
            alt="Web3Me"
            width={320}
            height={80}
            className="h-[80px] w-auto transition-opacity hover:opacity-80"
            priority
          />
        </Link>
      </div>

      {/* Accent line */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Main card — CutCorner with blur */}
      <CutCorner
        cut="lg"
        bg="rgba(8,12,18,0.72)"
        borderColor={`${accent}26`}
        borderWidth={1}
      >
        {/* Banner */}
        {bannerUrl && (
          <div className="relative w-full h-32 sm:h-44 overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.3) 0%, rgba(5,5,8,0.85) 100%)' }} />
          </div>
        )}

        {/* Hero — full width */}
        <ProfileHeader
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          username={user.username}
          bio={user.bio}
          verified={hasWallets}
          isClaimed={user.isClaimed}
          stats={stats}
          wallets={wallets}
          followerCount={followerCount}
          roi={traderStats?.roi}
          degenScore={degenScore}
          isOwner={isOwner}
          accentColor={accent}
        />

        {/* Divider */}
        <div className="mx-6" style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${accent}1f 30%, ${accent}1f 70%, transparent)` }} />

        {/* Content section — generous padding */}
        <div className="pb-6 pt-5 px-4 sm:px-7">


          {/* Links */}
          {links.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-5">
              {links.map((link) => (
                <LinkItem key={link.id} title={link.title} url={link.url} icon={link.icon} />
              ))}
            </div>
          )}

          {/* Divider between links and trades */}
          {links.length > 0 && (pinnedTrades.length > 0 || (deployments && deployments.length > 0)) && (
            <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
          )}

          {/* Trade calendar */}
          {calendarWeeks.length > 0 && <TradeCalendar weeks={calendarWeeks} />}

          {/* PnL history chart */}
          <PnlChart username={user.username} />

          {/* Pinned trades */}
          {pinnedTrades.length > 0 && (
            <div className="mb-5">
              <TradeCarousel trades={pinnedTrades} />
            </div>
          )}

          {/* Portfolio holdings */}
          <PortfolioView username={user.username} />

          {/* Token deployments */}
          {deployments && deployments.length > 0 && (
            <div className="mb-5">
              <DeploymentCarousel deployments={deployments} />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-center py-3.5 border-t border-[rgba(0,212,255,0.06)]">
          <Link href="/" className="cursor-pointer">
            <Image
              src="/logo.png"
              alt="Web3Me"
              width={112}
              height={28}
              className="h-[28px] w-auto opacity-25 transition-opacity hover:opacity-40"
            />
          </Link>
        </div>
      </CutCorner>
    </div>
  );
}
