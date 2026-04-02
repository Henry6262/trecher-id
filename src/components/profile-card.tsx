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
}

export function ProfileCard({ user, stats, links, pinnedTrades, wallets, traderStats, deployments, allTrades, degenScore }: ProfileCardProps) {
  const hasWallets = wallets.length > 0;

  // Compute achievements when we have enough data
  const achievements = traderStats && degenScore
    ? computeAchievements(stats, traderStats, degenScore)
    : [];

  // Build calendar from on-chain trade data if available
  const calendarWeeks = allTrades && allTrades.length > 0
    ? buildTradeCalendar(allTrades)
    : [];

  return (
    <div className="w-full max-w-[620px] mx-auto">
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
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />

      {/* Main card — CutCorner with blur */}
      <CutCorner
        cut="lg"
        bg="rgba(8,12,18,0.72)"
        borderColor="rgba(0,212,255,0.15)"
        borderWidth={1}
      >
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
          roi={traderStats?.roi}
          degenScore={degenScore}
        />

        {/* Divider */}
        <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.12) 30%, rgba(0,212,255,0.12) 70%, transparent)' }} />

        {/* Content section — generous padding */}
        <div className="pb-6 pt-5 px-7 sm:px-10">
          {/* Achievements */}
          {achievements.length > 0 && <TrophyCase achievements={achievements} />}

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

          {/* Pinned trades */}
          {pinnedTrades.length > 0 && (
            <div className="mb-5">
              <TradeCarousel trades={pinnedTrades} />
            </div>
          )}

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
