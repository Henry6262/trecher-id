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
  const achievements = traderStats && degenScore
    ? computeAchievements(stats, traderStats, degenScore)
    : [];

  // Build calendar from on-chain trade data if available
  const calendarWeeks = allTrades && allTrades.length > 0
    ? buildTradeCalendar(allTrades)
    : [];
  const showTradeSection = calendarWeeks.length > 0 || !!traderStats || pinnedTrades.length > 0;
  const showPortfolioSection = true;
  const showDeploymentsSection = !!(deployments && deployments.length > 0);
  const notableTrades = traderStats
    ? [
        traderStats.bestTrade
          ? {
              label: 'TOP WIN',
              symbol: traderStats.bestTrade.symbol,
              pnlPercent: traderStats.bestTrade.pnlPercent,
              tone: 'green' as const,
            }
          : null,
        traderStats.worstTrade
          ? {
              label: 'TOP LOSS',
              symbol: traderStats.worstTrade.symbol,
              pnlPercent: traderStats.worstTrade.pnlPercent,
              tone: 'red' as const,
            }
          : null,
      ].filter((trade): trade is {
        label: string;
        symbol: string;
        pnlPercent: number;
        tone: 'green' | 'red';
      } => trade !== null)
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
        {/* Hero — full width */}
        <ProfileHeader
          avatarUrl={user.avatarUrl}
          bannerUrl={bannerUrl}
          displayName={user.displayName}
          username={user.username}
          bio={user.bio}
          verified={hasWallets}
          isClaimed={user.isClaimed}
          stats={stats}
          wallets={wallets}
          followerCount={followerCount}
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
          {links.length > 0 && showTradeSection && (
            <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
          )}

          {/* Trade calendar */}
          {calendarWeeks.length > 0 && <TradeCalendar weeks={calendarWeeks} />}

          {/* Advanced stats */}
          {traderStats && (
            <div className="mb-5">
              <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">
                STATS
              </div>
              <EnhancedStats stats={traderStats} />
            </div>
          )}

          {/* Top win / top loss */}
          {notableTrades.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[9px] text-[var(--trench-text-muted)] tracking-[2px] mb-3">
                NOTABLE TRADES
                <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notableTrades.map((trade) => {
                  const color = trade.tone === 'green' ? 'var(--trench-green)' : 'var(--trench-red)';
                  const glow = trade.tone === 'green'
                    ? '0 0 18px rgba(34,197,94,0.12)'
                    : '0 0 18px rgba(239,68,68,0.12)';

                  return (
                    <div
                      key={trade.label}
                      className="cut-sm px-3.5 py-3"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(0,212,255,0.08)',
                        boxShadow: glow,
                      }}
                    >
                      <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-1.5">
                        {trade.label}
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[14px] font-bold text-[var(--trench-text)] truncate">
                            ${trade.symbol}
                          </div>
                          <div className="text-[9px] font-mono text-[var(--trench-text-muted)]">
                            Based on indexed trade history
                          </div>
                        </div>
                        <div
                          className="text-[18px] font-black font-mono leading-none"
                          style={{ color, textShadow: glow }}
                        >
                          {trade.pnlPercent >= 0 ? '+' : ''}{Math.round(trade.pnlPercent)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && <TrophyCase achievements={achievements} />}

          {/* PnL history chart */}
          <PnlChart username={user.username} />

          {/* Pinned trades */}
          {pinnedTrades.length > 0 && <TradeCarousel trades={pinnedTrades} />}

          {/* Divider between trade stack and portfolio */}
          {showTradeSection && showPortfolioSection && (
            <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
          )}

          {/* Portfolio holdings */}
          <PortfolioView username={user.username} />

          {/* Divider between portfolio and deployments */}
          {showPortfolioSection && showDeploymentsSection && (
            <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
          )}

          {/* Token deployments */}
          {deployments && deployments.length > 0 && <DeploymentCarousel deployments={deployments} />}

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
