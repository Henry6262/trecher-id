'use client';

import Link from 'next/link';
import { formatPnl, truncateAddress } from '@/lib/utils';
import { Check, ChevronDown, Star } from 'lucide-react';
import { DegenBadge } from './degen-badge';
import type { DegenScoreResult } from '@/lib/degen-score';
import { useState } from 'react';
import { AvatarImage } from './avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
import Image from 'next/image';
import type { CalendarWeek } from '@/lib/trade-calendar';
import { getDayColor } from '@/lib/trade-calendar';

function ShareButtons({ username, accent }: { username: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const profileUrl = `${origin}/${username}`;

  function copyLink() {
    navigator.clipboard.writeText(profileUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tweetText = encodeURIComponent(`See @${username}'s verified trading profile on Web3Me.\n${profileUrl}`);

  return (
    <>
      <button
        onClick={copyLink}
        className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', color: copied ? '#22c55e' : '#71717a' }}
      >
        {copied ? 'PROFILE COPIED' : 'COPY PROFILE'}
      </button>
      <Link
        href={`/${username}/card`}
        className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}
      >
        OPEN CARD
      </Link>
      <a
        href={`https://x.com/intent/tweet?text=${tweetText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
        style={{ background: `${accent}14`, border: `1px solid ${accent}33`, color: accent }}
      >
        SHARE ON X
      </a>
    </>
  );
}

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  displayName: string;
  username: string;
  bio?: string | null;
  verified?: boolean;
  isClaimed?: boolean;
  stats?: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  leaderboard?: {
    rank: number | null;
    period: '7d';
    updatedAt: string | null;
  };
  wallets?: { address: string; verified: boolean; isMain?: boolean }[];
  followerCount?: number | null;
  degenScore?: DegenScoreResult | null;
  isOwner?: boolean;
  accentColor?: string | null;
  tradeHighlights?: {
    symbol: string;
    pnlPercent: number | null;
    pnlSol: number | null;
    source: 'exact' | 'pinned';
  }[];
  deploymentHighlights?: {
    symbol: string;
    label: string;
    metric: string;
  }[];
  deployerSnapshot?: {
    totalDeployed: number;
    totalMigrated: number;
    graduationRate: number;
    tokens7d: number;
    tokens30d: number;
    syncedAt: string;
  } | null;
  historyPreviewWeeks?: CalendarWeek[];
  historyPreviewMode?: 'exact_helius' | 'derived_aggregates' | 'unavailable';
}

function formatSolDelta(value: number): string {
  const prefix = value >= 0 ? '+' : '-';
  const abs = Math.abs(value);
  if (abs >= 100) return `${prefix}${Math.round(abs)} SOL`;
  return `${prefix}${abs.toFixed(1)} SOL`;
}

function renderTradeHighlightValue(highlight: NonNullable<ProfileHeaderProps['tradeHighlights']>[number]): string {
  if (highlight.pnlPercent != null) {
    return `${highlight.pnlPercent >= 0 ? '+' : ''}${Math.round(highlight.pnlPercent)}%`;
  }

  return formatSolDelta(highlight.pnlSol ?? 0);
}

function buildHistorySummary(weeks: CalendarWeek[]) {
  const days = weeks.flatMap((week) => week.days).filter((day): day is NonNullable<CalendarWeek['days'][number]> => day !== null);
  const activeDays = days.filter((day) => day.tradeCount > 0);
  const totalTransactions = activeDays.reduce((sum, day) => sum + day.tradeCount, 0);
  const bestDay = activeDays.reduce<typeof activeDays[number] | null>((best, day) => {
    if (!best) return day;
    return day.pnlSol > best.pnlSol ? day : best;
  }, null);

  return {
    activeDays: activeDays.length,
    totalTransactions,
    bestDay,
  };
}

export function ProfileHeader({
  avatarUrl,
  bannerUrl,
  displayName,
  username,
  bio,
  verified,
  isClaimed,
  stats,
  leaderboard,
  wallets,
  followerCount,
  degenScore,
  isOwner,
  accentColor,
  tradeHighlights = [],
  deploymentHighlights = [],
  deployerSnapshot,
  historyPreviewWeeks = [],
  historyPreviewMode = 'unavailable',
}: ProfileHeaderProps) {
  const accent = accentColor || '#00D4FF';
  const resolvedAvatarUrl = getPublicAvatarUrl(username, avatarUrl);
  const [activeWallet, setActiveWallet] = useState(
    () => wallets?.findIndex(w => w.isMain) ?? 0
  );
  const [walletOpen, setWalletOpen] = useState(false);
  const walletSelectorOffset = isClaimed ? '-top-1' : 'top-3';
  const historySummary = buildHistorySummary(historyPreviewWeeks);

  const renderWalletSelector = (className: string) => (
    <div className={className}>
      <button
        onClick={() => setWalletOpen(!walletOpen)}
        className="cut-xs flex items-center gap-1.5 text-[8px] font-mono text-[var(--trench-text-muted)] px-2 py-1 transition-all hover:text-[var(--trench-accent)]"
        style={{
          background: bannerUrl ? 'rgba(8,12,18,0.66)' : 'rgba(0,212,255,0.04)',
          border: bannerUrl ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,212,255,0.08)',
          backdropFilter: bannerUrl ? 'blur(10px)' : undefined,
          WebkitBackdropFilter: bannerUrl ? 'blur(10px)' : undefined,
        }}
      >
        {wallets?.[activeWallet]?.isMain && <Star size={7} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
        <span className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: wallets?.[activeWallet]?.verified ? '#22c55e' : '#71717a' }} />
        {truncateAddress(wallets?.[activeWallet]?.address || '')}
        <ChevronDown size={9} className={`transition-transform ${walletOpen ? 'rotate-180' : ''}`} />
      </button>

      {walletOpen && wallets && wallets.length > 1 && (
        <div
          className="absolute top-full right-0 mt-1 cut-sm z-50"
          style={{
            background: 'rgba(8,12,18,0.95)',
            border: '1px solid rgba(0,212,255,0.12)',
            minWidth: '180px',
          }}
        >
          {wallets.map((w, i) => (
            <button
              key={w.address}
              onClick={() => { setActiveWallet(i); setWalletOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[9px] font-mono transition-all ${
                i === activeWallet ? 'text-[var(--trench-accent)]' : 'text-[var(--trench-text-muted)] hover:text-[var(--trench-text)]'
              }`}
              style={{ background: i === activeWallet ? 'rgba(0,212,255,0.06)' : 'transparent' }}
            >
              {w.isMain && <Star size={8} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
              <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: w.verified ? '#22c55e' : '#71717a' }} />
              {truncateAddress(w.address)}
              {i === activeWallet && <Check size={10} className="ml-auto text-[var(--trench-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
  const showHeroIntel = tradeHighlights.length > 0 || deploymentHighlights.length > 0 || deployerSnapshot || historyPreviewWeeks.length > 0 || historyPreviewMode !== 'unavailable';

  return (
    <div
      className="relative overflow-hidden"
      style={{
        padding: '20px 16px 20px',
      }}
    >
      {bannerUrl && (
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover object-center opacity-45"
            unoptimized
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                `radial-gradient(circle at 18% 22%, ${accent}1f 0%, transparent 34%)`,
                'linear-gradient(90deg, rgba(5,5,8,0.38) 0%, rgba(5,5,8,0.6) 42%, rgba(5,5,8,0.82) 100%)',
                'linear-gradient(180deg, rgba(5,5,8,0.12) 0%, rgba(5,5,8,0.62) 42%, rgba(5,5,8,0.94) 100%)',
              ].join(', '),
            }}
          />
        </div>
      )}

      <div className="relative z-10">
      {/* Claim banner — unclaimed profiles only */}
      {!isClaimed && (
        <div
          className="flex flex-col items-start gap-2 px-7 py-3 text-xs font-mono sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: bannerUrl ? 'rgba(8,12,18,0.72)' : 'rgba(0,212,255,0.04)',
            borderBottom: bannerUrl ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,212,255,0.08)',
            backdropFilter: bannerUrl ? 'blur(10px)' : undefined,
            WebkitBackdropFilter: bannerUrl ? 'blur(10px)' : undefined,
          }}
        >
          <span className="text-[var(--trench-text-muted)]">
            <span className="text-[var(--trench-text)]">@{username}</span>? This profile was created for you.
          </span>
          <Link
            href="/dashboard"
            className="transition-colors tracking-widest text-[10px]"
            style={{ color: accent }}
          >
            CLAIM IT →
          </Link>
        </div>
      )}

      {/* Wallet selector — top-right of card */}
      {wallets && wallets.length > 0 && (
        <>
          {renderWalletSelector('relative z-10 mb-4 flex justify-end sm:hidden')}
          {renderWalletSelector(`hidden sm:absolute sm:right-4 sm:z-10 ${walletSelectorOffset} sm:flex sm:justify-end`)}
        </>
      )}

      {/* Hero layout — avatar left, info right */}
      <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 ${bannerUrl ? 'pt-12 sm:pt-16' : ''}`}>
        {/* Avatar — left side, cut-corner branded */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-[-16px] pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)` }} />
          <div
            className="relative w-[110px] h-[110px] animate-[pulseGlow_3s_ease-in-out_infinite]"
            style={{
              borderRadius: '6px',
              background: `linear-gradient(135deg, ${accent}80, ${accent}26, ${accent}66)`,
              padding: '2px',
            }}
          >
            <div
              className="w-full h-full overflow-hidden"
              style={{
                borderRadius: '6px',
                background: '#0a0a0f',
              }}
            >
              <AvatarImage
                src={resolvedAvatarUrl}
                alt={displayName}
                width={110}
                height={110}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Info — right side */}
        <div className="flex-1 min-w-0 pt-1 w-full sm:w-auto text-center sm:text-left">
          {/* Row: name+badge left, PnL right */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-3">
            <div>
              {/* Name + badge + category */}
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <a
                  href={`https://x.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[24px] font-black text-white tracking-tight truncate hover:text-[var(--trench-accent)] transition-colors"
                >
                  @{username}
                </a>
                {verified && (
                  <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0" style={{ background: accent }}>
                    <Check size={11} strokeWidth={3} className="text-black" />
                  </div>
                )}
                {isClaimed && (
                  <span style={{ borderRadius: '6px', color: accent, border: `1px solid ${accent}4d`, background: `${accent}14` }} className="inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] tracking-widest ml-2">
                    ✓ VERIFIED
                  </span>
                )}
                <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold" style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}1f` }}>SOLANA TRADER</span>
                {leaderboard?.rank != null && (
                  <span
                    className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-mono"
                    style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}33` }}
                  >
                    7D RANK #{leaderboard.rank}
                  </span>
                )}
                {followerCount != null && followerCount > 0 && (
                  <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-mono" style={{ color: '#71717a', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {followerCount >= 1000 ? `${Math.round(followerCount / 1000)}K` : followerCount} FOLLOWERS
                  </span>
                )}
              </div>

              {/* Degen Badge */}
              {degenScore && (
                <div className="mt-2">
                  <DegenBadge result={degenScore} size="sm" />
                </div>
              )}

              {/* Bio */}
              {bio && (
                <p className="text-[11px] text-[var(--trench-text-muted)] mt-1 leading-snug max-w-[240px]">{bio}</p>
              )}
            </div>

            {/* PnL — far right */}
            {stats && (
              <div className="text-right flex-shrink-0 sm:ml-auto">
                <div
                  className="font-mono text-[20px] sm:text-[28px] font-black leading-none"
                  style={{
                    color: stats.totalPnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
                    textShadow: stats.totalPnlUsd >= 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)',
                  }}
                >
                  {formatPnl(stats.totalPnlUsd)}
                </div>
                <div className="text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mt-1">PnL</div>
                {leaderboard?.rank != null && (
                  <div className="mt-2 text-[8px] font-mono tracking-[1.5px]" style={{ color: accent }}>
                    LOCKED 7D #{leaderboard.rank}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share actions */}
      <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start">
        <ShareButtons username={username} accent={accent} />
      </div>

      {showHeroIntel && (
        <div className="mt-5 grid gap-3 lg:grid-cols-12">
          <section
            className="cut-sm px-4 py-4 lg:col-span-7"
            style={{
              background: `linear-gradient(135deg, ${accent}14 0%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.02) 100%)`,
              border: '1px solid rgba(0,212,255,0.1)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
            }}
          >
            <div className="mb-3 flex items-center gap-2 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
              TRADE HISTORY
              <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
              <span>{historyPreviewMode === 'exact_helius' ? 'EXACT' : historyPreviewMode === 'derived_aggregates' ? 'SYNCING' : 'EMPTY'}</span>
            </div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[18px] font-black tracking-tight text-[var(--trench-text)] sm:text-[22px]">
                  GitHub-style activity tape
                </div>
                <p className="mt-1 max-w-[420px] text-[10px] leading-relaxed text-[var(--trench-text-muted)]">
                  {historyPreviewMode === 'exact_helius'
                    ? 'Exact indexed swap events are live in the hero, so this profile opens with real activity context instead of a blank shell.'
                    : historyPreviewMode === 'derived_aggregates'
                      ? `${stats?.totalTrades ?? 0} aggregate trades are indexed, but the event-level backfill is still incomplete, so the heatmap remains locked until exact sync finishes.`
                      : 'This profile does not have event-level trade history yet, so the hero can only show headline stats for now.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                <span className="cut-xs px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {historySummary.activeDays} ACTIVE DAYS
                </span>
                <span className="cut-xs px-2 py-1" style={{ background: `${accent}14`, border: `1px solid ${accent}26`, color: accent }}>
                  {historySummary.totalTransactions} TXNS
                </span>
                {historySummary.bestDay && historyPreviewMode === 'exact_helius' && (
                  <span className="cut-xs px-2 py-1" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--trench-green)' }}>
                    BEST {historySummary.bestDay.pnlSol >= 0 ? '+' : ''}{Math.round(historySummary.bestDay.pnlSol)} SOL
                  </span>
                )}
              </div>
            </div>

            {historyPreviewWeeks.length > 0 && historyPreviewMode === 'exact_helius' ? (
              <>
                <div
                  className="overflow-x-auto no-scrollbar cut-sm px-3 py-3"
                  style={{
                    background: 'rgba(8,12,22,0.52)',
                    border: '1px solid rgba(0,212,255,0.08)',
                  }}
                >
                  <div className="min-w-max" style={{ display: 'flex', gap: '3px' }}>
                    {historyPreviewWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {week.days.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            title={day ? `${day.date} · ${day.tradeCount} tx` : undefined}
                            style={{
                              width: '11px',
                              height: '11px',
                              borderRadius: '6px',
                              background: day ? getDayColor(day.pnlSol) : 'transparent',
                              boxShadow: day && day.tradeCount > 0 ? '0 0 12px rgba(0,0,0,0.18)' : 'none',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">SOURCE</div>
                    <div className="mt-1 text-[12px] font-bold text-[var(--trench-text)]">Helius exact events</div>
                  </div>
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">WINDOW</div>
                    <div className="mt-1 text-[12px] font-bold text-[var(--trench-text)]">Last 16 weeks in hero</div>
                  </div>
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">READ</div>
                    <div className="mt-1 text-[12px] font-bold text-[var(--trench-text)]">Density + PnL intensity</div>
                  </div>
                </div>
              </>
            ) : (
              <div
                className="cut-sm px-4 py-4"
                style={{
                  background: 'rgba(8,12,22,0.45)',
                  border: '1px solid rgba(0,212,255,0.08)',
                }}
              >
                <div className="grid grid-cols-12 gap-1.5 opacity-45">
                  {Array.from({ length: 72 }).map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: '6px',
                        background: index % 7 === 0 ? `${accent}26` : 'rgba(255,255,255,0.05)',
                      }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-[var(--trench-text-muted)]">
                  {historyPreviewMode === 'derived_aggregates'
                    ? 'Exact event history exists only partially. Keep the hero honest: no fake heatmap until full wallet coverage is synced.'
                    : 'No event-level history has been indexed yet for this trader.'}
                </p>
              </div>
            )}
          </section>

          <div className="grid gap-3 lg:col-span-5">
            <section
              className="cut-sm px-4 py-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,212,255,0.08)',
              }}
            >
              <div className="mb-2 flex items-center gap-2 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
                TOP TRADES
                <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
                <span>{tradeHighlights.length}</span>
              </div>
              {tradeHighlights.length > 0 ? (
                <div className="space-y-2.5">
                  {tradeHighlights.map((highlight, index) => (
                    <div
                      key={`${highlight.symbol}-${highlight.source}`}
                      className="cut-xs flex items-center gap-3 px-3 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center text-[10px] font-black font-mono"
                        style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}26` }}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-bold text-[var(--trench-text)]">
                          ${highlight.symbol}
                        </div>
                        <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                          {highlight.source === 'exact' ? 'EXACTLY INDEXED' : 'PROFILE PINNED'}
                        </div>
                      </div>
                      <div
                        className="text-[18px] font-black font-mono leading-none"
                        style={{
                          color: (highlight.pnlPercent ?? highlight.pnlSol ?? 0) >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
                        }}
                      >
                        {renderTradeHighlightValue(highlight)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] leading-relaxed text-[var(--trench-text-muted)]">
                  No standout trades surfaced yet.
                </p>
              )}
            </section>

            {deployerSnapshot && (
              <section
                className="cut-sm px-4 py-4"
                style={{
                  background: `linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.02) 100%)`,
                  border: '1px solid rgba(34,197,94,0.12)',
                }}
              >
                <div className="mb-2 flex items-center gap-2 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
                  DEPLOYER PULSE
                  <div className="flex-1 h-px" style={{ background: 'rgba(34,197,94,0.16)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">MIGRATED</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--trench-text)]">{deployerSnapshot.totalMigrated}</div>
                  </div>
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">GR RATE</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--trench-green)]">{Math.round(deployerSnapshot.graduationRate)}%</div>
                  </div>
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">7D OUTPUT</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--trench-text)]">{deployerSnapshot.tokens7d}</div>
                  </div>
                  <div className="cut-xs px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">30D OUTPUT</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--trench-text)]">{deployerSnapshot.tokens30d}</div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <section
            className="cut-sm px-4 py-4 lg:col-span-12"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(0,212,255,0.08)',
            }}
          >
            <div className="mb-3 flex items-center gap-2 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
              BEST DEPLOYMENTS
              <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
              <span>{deploymentHighlights.length} RANKED</span>
            </div>
            {deploymentHighlights.length > 0 ? (
              <ol className="grid gap-2.5 lg:grid-cols-3">
                {deploymentHighlights.map((deployment, index) => (
                  <li
                    key={`${deployment.symbol}-${deployment.label}`}
                    className="cut-sm px-3.5 py-3"
                    style={{
                      background: index === 0 ? `${accent}10` : 'rgba(255,255,255,0.02)',
                      border: index === 0 ? `1px solid ${accent}2e` : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center text-[10px] font-black font-mono"
                        style={{
                          color: index === 0 ? accent : 'var(--trench-text-muted)',
                          background: index === 0 ? `${accent}18` : 'rgba(255,255,255,0.04)',
                          border: index === 0 ? `1px solid ${accent}2e` : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {index + 1}
                      </div>
                      <span className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                        {deployment.label}
                      </span>
                    </div>
                    <div className="text-[17px] font-black tracking-tight text-[var(--trench-text)]">
                      ${deployment.symbol}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-[var(--trench-text)]">
                      {deployment.metric}
                    </div>
                    <div className="mt-3 text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                      Hero-ranked deployment highlight
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[10px] leading-relaxed text-[var(--trench-text-muted)]">
                Deployment data exists in the profile, but no standout launches have been ranked yet.
              </p>
            )}
          </section>
        </div>
      )}

      {/* Edit button — own profiles only */}
      {isOwner && (
        <div className="absolute bottom-4 right-4 z-10">
          <Link
            href="/dashboard"
            className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
            style={{
              background: `${accent}0f`,
              border: `1px solid ${accent}26`,
              color: accent,
            }}
          >
            EDIT PROFILE
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
