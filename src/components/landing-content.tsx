'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Globe, ChevronRight, ExternalLink } from 'lucide-react';
import { AvatarImage } from '@/components/avatar-image';
import { CutButton } from '@/components/cut-button';
import { PublicNav } from '@/components/public-nav';
import ShinyText from '@/components/shiny-text';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { ActivityTicker } from '@/components/activity-ticker';
import { JourneySection } from '@/components/journey-section';
import { ReferralSection } from '@/components/referral-section';
import { SectionRailNav } from '@/components/section-rail-nav';
import { getPublicAvatarUrl } from '@/lib/images';
import type { TickerItem } from '@/lib/types';

const Lightspeed = dynamic(() => import('@/components/lightspeed'), { ssr: false });
const ShaderCard = dynamic(() => import('@/components/shader-card'), { ssr: false });
const DomeGallery = dynamic(() => import('@/components/DomeGallery'), { ssr: false });

interface TraderData {
  username: string;
  name: string;
  avatarUrl: string | null;
  pnl: string;
  pnlValue: number;
  winRate: string;
  winRateValue: number;
  trades: string;
  tradeCount: number;
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
  featuredProfiles: TraderData[];
  ticker: TickerItem[];
  leaderboardData?: LeaderboardTrader[];
  refCode?: string | null;
}

type CupView = 'bracket' | 'leaderboard';


// ─── Preview Card with Calendar/Chart toggle ───────────────

function buildPreviewCalendar(featured: TraderData) {
  const tradeCount = featured.tradeCount;
  const winRate = featured.winRateValue;
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
    <div className="grid gap-[1.5px]" style={{ gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
      {calendarData.map((cell, i) => (
        <div key={i} className="aspect-square rounded-[1px] relative group cursor-default" style={{ background: cell.pnl >= 0 ? `rgba(34,197,94,${cell.opacity})` : `rgba(239,68,68,${Math.max(0.08, cell.opacity)})`, minWidth: 4, minHeight: 4 }}>
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

function getValueTone(value: number) {
  return value >= 0
    ? { color: '#22c55e', shadow: '0 0 12px rgba(34,197,94,0.2)' }
    : { color: '#ef4444', shadow: '0 0 12px rgba(239,68,68,0.18)' };
}

function PreviewCardInner({ featured }: { featured: TraderData }) {
  const featuredProfileLabel = `web3me.fun/${featured.username}`;
  const profileHref = `/${featured.username}`;
  const pnlTone = getValueTone(featured.pnlValue);

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
                  src={getPublicAvatarUrl(featured.username, featured.avatarUrl)}
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
              <div className="text-[18px] font-black font-mono mt-1" style={{ color: pnlTone.color, textShadow: pnlTone.shadow }}>{featured.pnl}</div>
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
          <Link
            href={profileHref}
            className="group flex items-center gap-2.5 px-3 py-2 transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' }}
          >
            <Globe size={14} className="flex-shrink-0 text-[rgba(0,212,255,0.7)]" />
            <span className="text-[11px] text-white font-medium flex-1 truncate transition-colors group-hover:text-[var(--trench-accent)]">{featuredProfileLabel}</span>
            <ChevronRight size={14} className="text-[rgba(255,255,255,0.2)] flex-shrink-0 transition-colors group-hover:text-[var(--trench-accent)]" />
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

        <div className="py-3">
          <div className="px-5 text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">TOP TRADES</div>
          <div className="px-5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {featured.topTrades.map((trade) => {
                const tradeTone = getValueTone(trade.pnlPercentValue);
                const tradeHref = trade.tokenMint ? `https://dexscreener.com/solana/${trade.tokenMint}` : profileHref;
                const opensExternally = !!trade.tokenMint;
                return (
                  <a
                    key={trade.id}
                    href={tradeHref}
                    target={opensExternally ? '_blank' : undefined}
                    rel={opensExternally ? 'noopener noreferrer' : undefined}
                    className="group min-w-[210px] shrink-0 px-3 py-2.5 transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)',
                      textDecoration: 'none',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
                        style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.18)' }}
                      >
                        {trade.tokenImage ? (
                          <div className="relative h-full w-full">
                            <Image src={trade.tokenImage} alt={trade.token} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-white">{trade.token.replace('$', '').slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-bold text-white transition-colors group-hover:text-[var(--trench-accent)]">{trade.token}</div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold" style={{ color: tradeTone.color }}>
                          <span>{trade.pnlPercent}</span>
                          <ExternalLink size={10} className="text-[rgba(255,255,255,0.28)] opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {trade.buy && (
                        <div className="flex-1 rounded-[3px] border border-white/5 bg-white/[0.02] px-2 py-1 text-[8px] font-mono text-[var(--trench-text-muted)]">
                          BUY <span className="text-white">{trade.buy}</span>
                        </div>
                      )}
                      {trade.sell && (
                        <div className="flex-1 rounded-[3px] border border-white/5 bg-white/[0.02] px-2 py-1 text-[8px] font-mono text-[var(--trench-text-muted)]">
                          SELL <span style={{ color: tradeTone.color }}>{trade.sell}</span>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="px-5 mt-1 text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">TRADE HISTORY</div>
          <div className="px-5">
            <div
              className="px-3 py-2.5"
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

function PreviewCardCarousel({ profiles }: { profiles: TraderData[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (profiles.length <= 1) return;
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % profiles.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [profiles.length]);

  if (profiles.length === 0) return null;

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ width: `${profiles.length * 100}%`, transform: `translateX(-${index * (100 / profiles.length)}%)` }}
        >
          {profiles.map((profile) => (
            <div key={profile.username} className="h-full" style={{ width: `${100 / profiles.length}%` }}>
              <PreviewCardInner featured={profile} />
            </div>
          ))}
        </div>
      </div>

      {profiles.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {profiles.map((profile, profileIndex) => (
              <div
                key={profile.username}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: profileIndex === index ? 18 : 8,
                  background: profileIndex === index ? '#00D4FF' : 'rgba(255,255,255,0.24)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LandingContent({ traders, featuredProfiles, ticker, leaderboardData, refCode }: LandingContentProps) {
  const [cupView, setCupView] = useState<CupView>('bracket');

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

  const avatarUrls = traders.map((t) => getPublicAvatarUrl(t.username, t.avatarUrl));
  const domeImages = avatarUrls.map(src => ({ src, alt: '' }));
  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <PublicNav />
      <SectionRailNav />

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
        {/* Activity Ticker */}
        <ActivityTicker items={ticker} />

        {/* Hero */}
        <section id="hero" className="mx-auto grid max-w-[900px] scroll-mt-36 grid-cols-1 items-center gap-8 px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12 lg:grid-cols-2">
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
              The landing surface for Web3Me. Check the rankings, inspect the Trencher Cup, then jump into your dashboard to connect wallets and set up your trading identity.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <CutButton href="/dashboard" size="lg">Open Dashboard</CutButton>
              <CutButton href="/leaderboard" size="lg" variant="secondary">See Leaderboard</CutButton>
            </div>
            <p className="mt-4 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">LANDING &middot; LEADERBOARD &middot; DASHBOARD</p>
          </div>

          {/* Preview card — shader-backed profile card */}
          {featuredProfiles.length > 0 && (
            <div className="hidden sm:flex justify-center lg:justify-end">
              <ShaderCard
                width={420}
                height={480}
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
                <PreviewCardCarousel profiles={featuredProfiles} />
              </ShaderCard>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* The Trencher Cup */}
        <section id="cup" className="relative mx-auto max-w-[920px] scroll-mt-36 px-6 py-10 sm:px-12 sm:py-16 lg:px-16">
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
              Top 32 traders by 7-day realized PnL qualify for the cup.
            </p>
          </div>

          <div className="relative z-30 mb-5 flex justify-end pointer-events-auto">
            <CutButton
              onClick={() =>
                setCupView((current) =>
                  current === 'bracket' ? 'leaderboard' : 'bracket',
                )
              }
              variant="secondary"
              size="sm"
            >
              {cupView === 'bracket' ? 'SHOW LEADERBOARD' : 'SHOW BRACKET'}
            </CutButton>
          </div>

          <LeaderboardTable
            initialPeriod="7d"
            initialTraders={leaderboardData}
            variant={cupView === 'bracket' ? 'bracket' : 'full'}
            availableModes={['traders']}
          />
        </section>

        {/* Journey — merged How it works + Reward Pool */}
        <div id="journey" className="scroll-mt-36">
          <JourneySection />
        </div>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Referral Section */}
        <div id="referrals" className="scroll-mt-36">
          <ReferralSection />
        </div>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — gallery is the page ending */}
        <section id="traders" className="relative scroll-mt-36">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.4) 40%, rgba(5,5,8,0.7) 100%)' }} />

          <div className="mx-auto mb-6 max-w-[920px] px-6 sm:px-12 lg:px-16 relative text-center">
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
              <p className="mb-3 text-[12px] text-[var(--trench-text-muted)]">Ready to wire in your own wallets?</p>
              <CutButton href="/dashboard" size="lg">Open Dashboard</CutButton>
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
