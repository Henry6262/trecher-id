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
import { ProfileSideNav } from './profile-side-nav';
import type { TraderStats } from '@/lib/trade-stats';
import type { TokenTrade } from '@/lib/helius';
import type { DegenScoreResult } from '@/lib/degen-score';
import { computeAchievements } from '@/lib/achievements';
import { buildTradeCalendar } from '@/lib/trade-calendar';
import { PnlChart } from './pnl-chart';
import { PortfolioView } from './portfolio-view';
import type { CalendarWeek } from '@/lib/trade-calendar';

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
  leaderboard: {
    rank: number | null;
    period: '7d';
    updatedAt: string | null;
  };
  dataProvenance: {
    indexedWallets: number;
    verifiedWallets: number;
    tradedWallets: number;
    lastComputedAt: string | null;
    eventSource: 'exact_helius' | 'derived_aggregates' | 'unavailable';
    eventWalletCoverage: number;
    eventLookbackDays: number | null;
  };
  links: { id: string; title: string; url: string; icon?: string | null }[];
  pinnedTrades: {
    id: string;
    tokenMint?: string;
    tokenSymbol: string;
    tokenName?: string | null;
    tokenImage?: string | null;
    totalPnlPercent: number | null;
    totalPnlSol?: number;
    transactions: { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[];
  }[];
  wallets: { address: string; verified: boolean; isMain?: boolean }[];
  traderStats?: TraderStats | null;
  deployments?: DeploymentData[];
  deployerSnapshot?: {
    totalDeployed: number;
    totalMigrated: number;
    graduationRate: number;
    tokens7d: number;
    tokens30d: number;
    syncedAt: string;
  } | null;
  allTrades?: TokenTrade[];
  degenScore?: DegenScoreResult | null;
  followerCount?: number | null;
  isOwner?: boolean;
  accentColor?: string | null;
  bannerUrl?: string | null;
}

interface HeroTradeHighlight {
  symbol: string;
  pnlPercent: number | null;
  pnlSol: number | null;
  source: 'exact' | 'pinned';
}

interface HeroDeploymentHighlight {
  symbol: string;
  label: string;
  metric: string;
}

function formatLastComputedAt(value: string | null): string {
  if (!value) return 'Awaiting sync';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Awaiting sync';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildTradeHighlightScore(pnlPercent: number | null, pnlSol: number | null): number {
  if (pnlPercent != null) return pnlPercent;
  if (pnlSol != null) return pnlSol * 10;
  return Number.NEGATIVE_INFINITY;
}

function buildHeroTradeHighlights(
  allTrades: TokenTrade[] | undefined,
  pinnedTrades: ProfileCardProps['pinnedTrades'],
): HeroTradeHighlight[] {
  const highlights = [
    ...(allTrades ?? []).map((trade) => ({
      symbol: trade.tokenSymbol,
      pnlPercent: trade.totalPnlPercent,
      pnlSol: trade.totalPnlSol,
      source: 'exact' as const,
    })),
    ...pinnedTrades.map((trade) => ({
      symbol: trade.tokenSymbol,
      pnlPercent: trade.totalPnlPercent,
      pnlSol: trade.totalPnlSol ?? null,
      source: 'pinned' as const,
    })),
  ];

  const bestBySymbol = new Map<string, HeroTradeHighlight>();

  for (const highlight of highlights) {
    const existing = bestBySymbol.get(highlight.symbol);
    if (!existing || buildTradeHighlightScore(highlight.pnlPercent, highlight.pnlSol) > buildTradeHighlightScore(existing.pnlPercent, existing.pnlSol)) {
      bestBySymbol.set(highlight.symbol, highlight);
    }
  }

  return Array.from(bestBySymbol.values())
    .filter((highlight) => highlight.pnlPercent != null || highlight.pnlSol != null)
    .sort((a, b) => buildTradeHighlightScore(b.pnlPercent, b.pnlSol) - buildTradeHighlightScore(a.pnlPercent, a.pnlSol))
    .slice(0, 3);
}

function buildHeroDeploymentHighlights(deployments: DeploymentData[] | undefined): HeroDeploymentHighlight[] {
  if (!deployments || deployments.length === 0) return [];

  const formatCompactUsd = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value)}`;
  };

  return [...deployments]
    .sort((a, b) => {
      const aScore = a.mcapAthUsd ?? a.devPnlUsd ?? a.volumeUsd ?? 0;
      const bScore = b.mcapAthUsd ?? b.devPnlUsd ?? b.volumeUsd ?? 0;
      return bScore - aScore;
    })
    .slice(0, 3)
    .map((deployment) => ({
      symbol: deployment.tokenSymbol,
      label: deployment.status.toUpperCase(),
      metric: deployment.mcapAthUsd != null
        ? `${formatCompactUsd(deployment.mcapAthUsd)} ATH`
        : deployment.devPnlUsd != null
          ? `${deployment.devPnlUsd >= 0 ? '+' : '-'}$${Math.round(Math.abs(deployment.devPnlUsd)).toLocaleString()} DEV`
          : deployment.volumeUsd != null
            ? `$${Math.round(deployment.volumeUsd).toLocaleString()} VOL`
            : 'Tracked',
    }));
}

function buildHeroCalendarWeeks(weeks: CalendarWeek[]): CalendarWeek[] {
  return weeks.slice(-16);
}

export function ProfileCard({ user, stats, leaderboard, dataProvenance, links, pinnedTrades, wallets, traderStats, deployments, deployerSnapshot, allTrades, degenScore, followerCount, isOwner, accentColor, bannerUrl }: ProfileCardProps) {
  const hasWallets = wallets.length > 0;
  const achievements = traderStats && degenScore
    ? computeAchievements(stats, traderStats, degenScore)
    : [];

  // Build calendar from on-chain trade data if available
  // Only show trade history if user has wallets linked AND has exact helius data
  const calendarWeeks = hasWallets && allTrades && allTrades.length > 0
    ? buildTradeCalendar(allTrades)
    : [];
  const showBehavioralAnalytics = hasWallets && dataProvenance.eventSource === 'exact_helius' && !!traderStats && calendarWeeks.length > 0;
  const showTradeSection = showBehavioralAnalytics || pinnedTrades.length > 0;
  const showPortfolioSection = true;
  const showDeploymentsSection = !!(deployments && deployments.length > 0);
  const heroTradeHighlights = buildHeroTradeHighlights(allTrades, pinnedTrades);
  const heroDeploymentHighlights = buildHeroDeploymentHighlights(deployments);
  const heroCalendarWeeks = buildHeroCalendarWeeks(calendarWeeks);
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
  const profileSections = [
    links.length > 0 ? { id: 'profile-links', label: 'Links', hint: 'External destinations and social graph' } : null,
    hasWallets ? { id: 'profile-proof', label: 'Proof', hint: 'Wallet coverage and data integrity' } : null,
    showBehavioralAnalytics ? { id: 'profile-performance', label: 'Performance', hint: 'Calendar, stats, and signal quality' } : null,
    pinnedTrades.length > 0 ? { id: 'profile-trades', label: 'Trades', hint: 'Pinned wins and conviction calls' } : null,
    showPortfolioSection ? { id: 'profile-portfolio', label: 'Portfolio', hint: 'Live holdings and allocation' } : null,
    showDeploymentsSection ? { id: 'profile-deployments', label: 'Deployments', hint: 'Tokens launched and migrated' } : null,
  ].filter((section): section is { id: string; label: string; hint: string } => section !== null);

  return (
    <div className="w-full max-w-[980px] mx-auto" style={{ '--profile-accent': accent } as React.CSSProperties}>
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
          verified={dataProvenance.verifiedWallets > 0}
          isClaimed={user.isClaimed}
          stats={stats}
          leaderboard={leaderboard}
          wallets={wallets}
          followerCount={followerCount}
          degenScore={degenScore}
          isOwner={isOwner}
          accentColor={accent}
          tradeHighlights={heroTradeHighlights}
          deploymentHighlights={heroDeploymentHighlights}
          deployerSnapshot={deployerSnapshot}
          historyPreviewWeeks={heroCalendarWeeks}
          historyPreviewMode={dataProvenance.eventSource}
        />

        {/* Divider */}
        <div className="mx-6" style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${accent}1f 30%, ${accent}1f 70%, transparent)` }} />

        {/* Content section — generous padding */}
        <div className="pb-6 pt-5 px-4 sm:px-7">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-6">
            <div className="min-w-0">
              {/* Links */}
              {links.length > 0 && (
                <section id="profile-links" className="mb-5">
                  <div className="mb-3 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
                    LINKS
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {links.map((link) => (
                      <LinkItem key={link.id} title={link.title} url={link.url} icon={link.icon} />
                    ))}
                  </div>
                </section>
              )}

              {links.length > 0 && showTradeSection && (
                <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
              )}

              {hasWallets && (
                <section
                  id="profile-proof"
                  className="mb-5 cut-sm px-3.5 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(0,212,255,0.08)',
                  }}
                >
                  <div className="mb-2 flex items-center gap-2 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
                    DATA INTEGRITY
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
                  </div>
                  <div className="space-y-1.5 text-[10px] leading-relaxed text-[var(--trench-text-muted)]">
                    <p>
                      <span className="text-[var(--trench-text)]">Verified aggregates:</span>{' '}
                      total PnL, win rate, trade count, and wallet coverage are computed from indexed wallet data.
                    </p>
                    {dataProvenance.eventSource === 'exact_helius' && (
                      <p>
                        <span className="text-[var(--trench-text)]">Exact event views:</span>{' '}
                        calendar, PnL history, ROI, streak, hold time, and notable-trade insights come from recent indexed Helius swap events.
                      </p>
                    )}
                    {dataProvenance.eventSource === 'derived_aggregates' && (
                      <p>
                        <span className="text-[var(--trench-text)]">Behavioral analytics hidden:</span>{' '}
                        event-level views are withheld until exact swap-event coverage is complete for the wallets that actually traded.
                      </p>
                    )}
                    {dataProvenance.eventSource === 'unavailable' && (
                      <p>
                        <span className="text-[var(--trench-text)]">No event analytics yet:</span>{' '}
                        this profile does not currently have exact event-level trade history to power calendars, streaks, or hold-time metrics.
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                    <span>{dataProvenance.indexedWallets} INDEXED WALLETS</span>
                    <span>{dataProvenance.verifiedWallets} VERIFIED</span>
                    {dataProvenance.tradedWallets > 0 && (
                      <span>
                        EVENT COVERAGE {dataProvenance.eventWalletCoverage}/{dataProvenance.tradedWallets} TRADED WALLETS
                      </span>
                    )}
                    {dataProvenance.eventSource === 'exact_helius' && dataProvenance.eventLookbackDays != null && (
                      <span>LOOKBACK {dataProvenance.eventLookbackDays}D</span>
                    )}
                    <span>LAST SYNC {formatLastComputedAt(dataProvenance.lastComputedAt).toUpperCase()}</span>
                  </div>
                </section>
              )}

              {showBehavioralAnalytics && (
                <section id="profile-performance" className="mb-5">
                  <TradeCalendar weeks={calendarWeeks} />

                  {traderStats && (
                    <div className="mt-5">
                      <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">
                        STATS
                      </div>
                      <EnhancedStats stats={traderStats} />
                    </div>
                  )}

                  {notableTrades.length > 0 && (
                    <div className="mt-5">
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

                  {achievements.length > 0 && <div className="mt-5"><TrophyCase achievements={achievements} /></div>}

                  <div className="mt-5">
                    <PnlChart username={user.username} />
                  </div>
                </section>
              )}

              {pinnedTrades.length > 0 && (
                <section id="profile-trades" className="mb-5">
                  <TradeCarousel trades={pinnedTrades} />
                </section>
              )}

              {showTradeSection && showPortfolioSection && (
                <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
              )}

              <section id="profile-portfolio" className="mb-5">
                <PortfolioView username={user.username} />
              </section>

              {showPortfolioSection && showDeploymentsSection && (
                <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />
              )}

              {deployments && deployments.length > 0 && (
                <section id="profile-deployments">
                  <DeploymentCarousel deployments={deployments} />
                </section>
              )}
            </div>

            <div className="mt-6 lg:mt-0">
              <ProfileSideNav
                accentColor={accent}
                rank={leaderboard.rank}
                totalPnlUsd={stats.totalPnlUsd}
                verifiedWallets={dataProvenance.verifiedWallets}
                indexedWallets={dataProvenance.indexedWallets}
                sections={profileSections}
              />
            </div>
          </div>
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
