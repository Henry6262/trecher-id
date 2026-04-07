'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Globe, ChevronRight } from 'lucide-react';
import { AvatarImage } from '@/components/avatar-image';
import { CutButton } from '@/components/cut-button';
import ShinyText from '@/components/shiny-text';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { ActivityTicker } from '@/components/activity-ticker';
import { JourneySection } from '@/components/journey-section';
import { ReferralSection } from '@/components/referral-section';
import { normalizeImageUrl } from '@/lib/images';
import type { TickerItem } from '@/lib/types';

const Lightspeed = dynamic(() => import('@/components/lightspeed'), { ssr: false });
const ShaderCard = dynamic(() => import('@/components/shader-card'), { ssr: false });
const DomeGallery = dynamic(() => import('@/components/DomeGallery'), { ssr: false });

interface TraderData {
  username: string;
  name: string;
  avatarUrl: string | null;
  pnl: string;
  winRate: string;
  trades: string;
  recentToken: string | null;
  recentTokenImage: string | null;
  recentPnl: string | null;
  recentBuy: string | null;
  recentSell: string | null;
}

interface LeaderboardTrader {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isClaimed: boolean;
  pnlUsd: number;
  pnlSol: number;
  winRate: number;
  trades: number;
}

interface LandingContentProps {
  traders: TraderData[];
  featured: TraderData | null;
  ticker: TickerItem[];
  leaderboardData?: LeaderboardTrader[];
  refCode?: string | null;
}


// ─── Preview Card with Calendar/Chart toggle ───────────────

function buildPreviewCalendar(featured: TraderData) {
  const parsedTrades = Number.parseInt(featured.trades.replace(/[^0-9]/g, ''), 10);
  const tradeCount = Number.isFinite(parsedTrades) ? parsedTrades : 0;
  const parsedWinRate = Number.parseFloat(featured.winRate.replace('%', ''));
  const winRate = Number.isFinite(parsedWinRate) ? parsedWinRate : 50;
  const seed = featured.username
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

  return Array.from({ length: 56 }, (_, i) => {
    const wave = Math.sin((seed + i) * 0.73) * 0.5 + 0.5;
    const burst = Math.cos((seed + i * 3) * 0.41) * 0.5 + 0.5;
    const activity = Math.min(1, tradeCount / 120);
    const weighted = wave * 0.65 + burst * 0.35;
    const trades = weighted > 0.72
      ? Math.max(1, Math.round(weighted * (8 + activity * 10)))
      : weighted > 0.42
        ? Math.max(1, Math.round(weighted * (3 + activity * 6)))
        : 0;
    const edge = (winRate - 50) / 50;
    const pnl = trades > 0 ? Math.round(((weighted - 0.5) + edge * 0.35) * 700) : 0;
    const opacity = trades === 0 ? 0.05 : trades > 6 ? 0.8 : trades > 2 ? 0.4 : 0.15;
    const daysAgo = 55 - i;
    const date = new Date(Date.now() - daysAgo * 86400000);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { opacity, trades, pnl, label };
  });
}

function MiniCalendar({ featured }: { featured: TraderData }) {
  const calendarData = buildPreviewCalendar(featured);
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
      {calendarData.map((cell, i) => (
        <div key={i} className="aspect-square rounded-[1.5px] relative group cursor-default" style={{ background: `rgba(34,197,94,${cell.opacity})`, minWidth: 6, minHeight: 6 }}>
          {cell.trades > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 pointer-events-none">
              <div className="px-2.5 py-1.5 whitespace-nowrap text-center" style={{ background: 'rgba(8,12,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <div className="text-[8px] font-mono text-[#888] mb-0.5">{cell.label}</div>
                <div className="text-[9px] font-mono font-bold" style={{ color: cell.pnl >= 0 ? '#22c55e' : '#ef4444' }}>{cell.pnl >= 0 ? '+' : ''}{cell.pnl} SOL</div>
                <div className="text-[8px] font-mono text-[#666]">{cell.trades} trades</div>
              </div>
              <div className="w-0 h-0 mx-auto" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(255,255,255,0.1)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewCardInner({ featured }: { featured: TraderData }) {
  const featuredProfileLabel = `web3me.fun/${featured.username}`;

  return (
    <div className="w-full h-full flex flex-col" style={{ transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)' }}>
      <div className="flex-1 flex flex-col" style={{ background: 'rgba(8,12,18,0.72)' }}>
        {/* Profile header with metrics on right */}
        <div className="px-5 pt-5 pb-3 relative">
          <div className="flex items-start gap-3.5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="overflow-hidden" style={{ width: 56, height: 56, clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' }}>
                <AvatarImage
                  src={featured.avatarUrl || `https://unavatar.io/twitter/${featured.username}`}
                  alt={featured.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: '#00D4FF', border: '2px solid rgba(8,12,18,0.9)' }}>
                <Check size={9} strokeWidth={3} className="text-black" />
              </div>
            </div>

            {/* Name + handle */}
            <div className="flex-1 min-w-0 pt-0.5">
              <span className="text-[15px] font-bold text-white leading-tight truncate block">{featured.name}</span>
              <div className="text-[11px] text-[var(--trench-text-muted)]">@{featured.username}</div>
              <div className="text-[18px] font-black font-mono mt-1" style={{ color: '#22c55e', textShadow: '0 0 12px rgba(34,197,94,0.2)' }}>{featured.pnl}</div>
            </div>

            {/* Metrics stacked vertically — absolute right */}
            <div className="absolute top-5 right-5 flex flex-col gap-1.5">
              {[
                { val: featured.winRate, label: 'WIN RATE' },
                { val: featured.trades, label: 'TRADES' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-end">
                  <span className="font-mono text-[12px] font-bold text-white leading-none">{s.val}</span>
                  <span className="text-[6px] tracking-[1px] text-[var(--trench-text-muted)] mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)' }} />

        {/* Link — single */}
        <div className="px-5 py-3">
          <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">LINKS</div>
          <div className="flex items-center gap-2.5 px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' }}>
            <Globe size={14} className="flex-shrink-0 text-[rgba(0,212,255,0.7)]" />
            <span className="text-[11px] text-white font-medium flex-1 truncate">{featuredProfileLabel}</span>
            <ChevronRight size={14} className="text-[rgba(255,255,255,0.2)] flex-shrink-0" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

        {/* Trade history + latest verified trade */}
        <div className="py-3">
          <div className="px-5 text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">TRADE HISTORY</div>
          <div className="px-5">
            {featured.recentToken && (
              <div
                className="mb-3 flex items-center gap-2.5 px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)',
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.18)' }}
                >
                  {featured.recentTokenImage ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={featured.recentTokenImage}
                        alt={featured.recentToken}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-white">
                      {featured.recentToken.replace('$', '').slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold text-white">{featured.recentToken}</div>
                  {featured.recentPnl && (
                    <div className="text-[10px] font-mono font-bold text-[#22c55e]">{featured.recentPnl}</div>
                  )}
                </div>
                <div className="text-right">
                  {featured.recentBuy && (
                    <div className="text-[8px] font-mono text-[var(--trench-text-muted)]">
                      BUY <span className="text-white">{featured.recentBuy}</span>
                    </div>
                  )}
                  {featured.recentSell && (
                    <div className="text-[8px] font-mono text-[var(--trench-text-muted)]">
                      SELL <span className="text-[#22c55e]">{featured.recentSell}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div
              className="px-3 py-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)',
              }}
            >
              <MiniCalendar featured={featured} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex justify-center py-2.5 border-t border-[rgba(255,255,255,0.04)]">
          <Image src="/logo.png" alt="Web3Me" width={80} height={20} className="h-4 w-auto opacity-30" />
        </div>
      </div>
    </div>
  );
}

export function LandingContent({ traders, featured, ticker, leaderboardData, refCode }: LandingContentProps) {
  // Capture referral code from URL into localStorage + HttpOnly cookie
  useEffect(() => {
    if (!refCode) return;
    localStorage.setItem('web3me_ref', refCode);
    fetch('/api/referral/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: refCode }),
    }).catch(() => {});
  }, [refCode]);

  const avatarUrls = traders.map((t) => normalizeImageUrl(t.avatarUrl) || `https://unavatar.io/twitter/${t.username}`);
  const domeImages = avatarUrls.map(src => ({ src, alt: '' }));
  const rankedTraders = leaderboardData ?? [];
  const cupStats = [
    {
      label: 'RANKED NOW',
      value: rankedTraders.length > 0 ? String(rankedTraders.length) : '0',
    },
    {
      label: 'TOP 32 CUT',
      value: rankedTraders.length >= 32 ? 'LOCKED' : `${Math.max(0, 32 - rankedTraders.length)} LEFT`,
    },
    {
      label: '7D LEADER',
      value: rankedTraders[0] ? `${rankedTraders[0].pnlSol >= 0 ? '+' : ''}${Math.round(rankedTraders[0].pnlSol)} SOL` : 'TBD',
    },
  ];

  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <Lightspeed
          primaryColor="#00D4FF"
          secondaryColor="#0066AA"
          tertiaryColor="#00A3CC"
          speed={0.7}
          streakCount={140}
          stretchFactor={0.045}
          intensity={1.1}
          fadePower={2.0}
          opacity={1.0}
          quality="medium"
          interactionEnabled={true}
        />
      </div>

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Nav — glassmorphic sticky bar */}
        <nav
          className="sticky top-0 z-10"
          style={{
            background: 'rgba(5,5,8,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(0,212,255,0.06)',
          }}
        >
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-5">
          <Link href="/">
            <Image src="/logo.png" alt="Web3Me" width={160} height={40} className="h-10 w-auto transition-opacity hover:opacity-80" priority />
          </Link>
          <CutButton href="/login" variant="secondary" size="sm">Sign in with X</CutButton>
        </div>
        </nav>

        {/* Activity Ticker */}
        <ActivityTicker items={ticker} />

        {/* Hero */}
        <section className="mx-auto grid max-w-[900px] grid-cols-1 items-center gap-8 px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-12 lg:grid-cols-2">
          <div>
            <div className="cut-xs mb-6 inline-flex items-center gap-1.5 border border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.08)] px-3 py-1 text-[10px] font-mono tracking-[2px] text-[var(--trench-accent)]">
              <Check size={10} strokeWidth={3} />
              <ShinyText text="ON-CHAIN VERIFIED" speed={3} />
            </div>

            <h1 className="mb-4 text-4xl leading-[1] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your{' '}
              <span className="text-[var(--trench-accent)]">
                <span className="relative inline-block" style={{ width: 90, verticalAlign: 'baseline' }}>
                  <Image
                    src="/logo.png"
                    alt=""
                    width={100}
                    height={28}
                    className="!max-w-none absolute"
                    style={{ width: 100, height: 'auto', top: '50%', left: -6, transform: 'translateY(-50%)', filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.3))' }}
                  />
                  <span style={{ visibility: 'hidden' }}>W</span>
                </span>eb3
              </span>
              <br />Bio Link
            </h1>

            <p className="mb-8 max-w-sm text-sm leading-relaxed text-[var(--trench-text-muted)]">
              The shareable identity page for Solana traders. Custom links, verified on-chain trading performance, one URL.
            </p>

            <CutButton href="/login" size="lg">Create Your Web3Me</CutButton>
            <p className="mt-4 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">FREE &middot; 30 SECONDS &middot; SIGN IN WITH X</p>
          </div>

          {/* Preview card — shader-backed profile card */}
          {featured && (
            <div className="hidden sm:flex justify-center lg:justify-end">
              <ShaderCard
                width={360}
                height={380}
                color="#00D4FF"
                speed={0.6}
                positionY={0.35}
                scale={2.5}
                branchIntensity={0.8}
                verticalExtent={1.0}
                horizontalExtent={1.2}
                effectRadius={1.2}
                waveAmount={0.3}
                blur={8}
                opacity={1.0}
                className="rounded-2xl shadow-[0_0_40px_rgba(0,212,255,0.12),0_8px_32px_rgba(0,0,0,0.5)] border border-[rgba(0,212,255,0.2)]"
                borderRadius="16px"
              >
                <PreviewCardInner featured={featured} />
              </ShaderCard>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* The Trencher Cup */}
        <section className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16 py-10 sm:py-16">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.55) 55%, rgba(0,212,255,0.08) 100%)' }} />
              <div className="text-[9px] font-mono tracking-[3px] uppercase" style={{ color: 'rgba(0,212,255,0.75)' }}>
                Tournament
              </div>
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.08) 0%, rgba(0,212,255,0.55) 45%, transparent 100%)' }} />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
              The Trencher <span style={{ color: '#00D4FF' }}>Cup</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[13px] leading-relaxed text-[var(--trench-text-muted)]">
              Top 32 traders by 7-day realized PnL enter the cup. The top two from each group advance into knockouts, and the champion takes the spotlight.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {cupStats.map((stat) => (
              <div
                key={stat.label}
                className="cut-sm px-4 py-3 text-center"
                style={{ background: 'rgba(8,12,18,0.62)', border: '1px solid rgba(0,212,255,0.08)' }}
              >
                <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-1">
                  {stat.label}
                </div>
                <div className="text-[18px] font-black font-mono text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <LeaderboardTable initialPeriod="7d" initialTraders={leaderboardData} variant="bracket" />

          <div className="mt-8 flex justify-center">
            <CutButton href="/leaderboard" variant="secondary" size="md">Open Full Rankings</CutButton>
          </div>
        </section>

        {/* Journey — merged How it works + Reward Pool */}
        <JourneySection />

        {/* Divider */}
        <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Referral Section */}
        <ReferralSection />

        {/* Divider */}
        <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — gallery is the page ending */}
        <section className="relative">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.4) 40%, rgba(5,5,8,0.7) 100%)' }} />

          <div className="mx-auto mb-6 max-w-[780px] px-6 sm:px-12 lg:px-16 relative text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.55) 55%, rgba(0,212,255,0.08) 100%)' }} />
              <div className="text-[9px] font-mono tracking-[3px] uppercase" style={{ color: 'rgba(0,212,255,0.75)' }}>
                Community
              </div>
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.08) 0%, rgba(0,212,255,0.55) 45%, transparent 100%)' }} />
            </div>
            <h2 className="mb-1 text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">Top <span className="text-[var(--trench-accent)]">Traders</span></h2>
            <p className="text-[13px] text-[var(--trench-text-muted)]">Already on Web3Me. Are you?</p>
          </div>

          <div className="h-[520px] w-full relative">
            {/* CTA centered on gallery */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center px-10 py-8 cut-sm" style={{ background: 'rgba(5,5,8,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 0 60px rgba(5,5,8,0.8), 0 0 120px rgba(5,5,8,0.4)' }}>
              <p className="mb-3 text-[12px] text-[var(--trench-text-muted)]">Create yours today.</p>
              <CutButton href="/login" size="lg">Create Your Web3Me</CutButton>
            </div>

            <DomeGallery
              images={domeImages}
              fit={0.8}
              minRadius={500}
              maxVerticalRotationDeg={0}
              segments={34}
              dragDampening={2}
              grayscale={false}
            />
          </div>

          {/* Footer — overlaid at bottom of gallery */}
          <div className="absolute bottom-0 left-0 right-0 py-4 text-center z-10">
            <Link href="/" className="mb-1 inline-block">
              <Image src="/logo.png" alt="Web3Me" width={96} height={24} className="mx-auto h-5 w-auto opacity-20 transition-opacity hover:opacity-40" />
            </Link>
            <br />
            <span className="text-[8px] font-mono tracking-[2px] text-[rgba(255,255,255,0.15)]">WEB3ME &middot; SOLANA &middot; 2026</span>
          </div>
        </section>
      </div>
    </div>
  );
}
