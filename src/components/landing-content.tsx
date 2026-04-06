'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check, AtSign, BarChart3, Zap } from 'lucide-react';
import { CutButton } from '@/components/cut-button';
import { GlassCard } from '@/components/glass-card';
import ShinyText from '@/components/shiny-text';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { ActivityTicker } from '@/components/activity-ticker';
import { JourneySection } from '@/components/journey-section';
import type { TickerItem } from '@/lib/types';

const RisingLines = dynamic(() => import('@/components/rising-lines'), { ssr: false });
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
}


export function LandingContent({ traders, featured, ticker, leaderboardData }: LandingContentProps) {
  const avatarUrls = traders.map(t => t.avatarUrl || `https://unavatar.io/twitter/${t.username}`);
  const domeImages = avatarUrls.map(src => ({ src, alt: '' }));

  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <div className="fixed inset-0 opacity-75" style={{ zIndex: 0 }}>
        <RisingLines
          color="#00D4FF" horizonColor="#00D4FF" haloColor="#33DDFF"
          riseSpeed={0.08} riseScale={10} riseIntensity={1.3}
          flowSpeed={0.15} flowDensity={4} flowIntensity={0.7}
          horizonIntensity={0.9} haloIntensity={7.5} horizonHeight={-0.85}
          circleScale={-0.5} scale={6.5} brightness={1.1}
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
                <span className="relative inline-block" style={{ width: 50, verticalAlign: 'baseline' }}>
                  <img src="/logo.png" alt="" className="!max-w-none absolute" style={{ width: 100, height: 'auto', bottom: -8, left: -12, filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.3))' }} />
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

          {/* Preview card — mirrors real profile layout */}
          {featured && <div className="hidden sm:block w-full sm:w-[340px] mx-auto lg:mx-0" style={{ transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)' }}>
            {/* Accent line */}
            <div className="h-[2px] mb-0" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />

            {/* Main card */}
            <GlassCard cut={12} bg="rgba(8,12,18,0.82)">
              {/* Profile header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-full" style={{ border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 24px rgba(0,212,255,0.2)' }}>
                      <Image
                        src={featured.avatarUrl || `https://unavatar.io/twitter/${featured.username}`}
                        alt={featured.name}
                        width={72}
                        height={72}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Verified badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: '#00D4FF', border: '2px solid rgba(8,12,18,0.9)' }}>
                      <Check size={9} strokeWidth={3} className="text-black" />
                    </div>
                  </div>

                  {/* Name + handle + bio */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-[15px] font-bold text-white leading-tight truncate">{featured.name}</div>
                    <div className="text-[11px] text-[var(--trench-accent)] mb-1.5">@{featured.username}</div>
                    <div className="text-[10px] leading-relaxed text-[var(--trench-text-muted)]">Solana trader · On-chain verified</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-2 mb-1">
                  {[
                    { val: featured.pnl, label: 'TOTAL PnL', color: 'var(--trench-green)' },
                    { val: featured.winRate, label: 'WIN RATE', color: 'var(--trench-accent)' },
                    { val: featured.trades, label: 'TRADES', color: 'var(--trench-text)' },
                  ].map(s => (
                    <div key={s.label} className="flex-1 flex flex-col items-center py-2 px-1" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' }}>
                      <span className="font-mono text-[13px] font-bold" style={{ color: s.color }}>{s.val}</span>
                      <span className="text-[6px] tracking-[1px] text-[var(--trench-text-muted)] mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.12) 30%, rgba(0,212,255,0.12) 70%, transparent)' }} />

              {/* Links */}
              <div className="px-5 pt-4 pb-3 flex flex-col gap-1.5">
                {[
                  { icon: <AtSign size={13} />, label: `Follow @${featured.username}` },
                  { icon: <BarChart3 size={13} />, label: 'Trading Dashboard' },
                  { icon: <Zap size={13} />, label: 'Latest Calls' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2.5 px-3 py-2" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' }}>
                    <span className="text-[var(--trench-accent)]">{l.icon}</span>
                    <span className="flex-1 text-[11px] text-white">{l.label}</span>
                    <span className="text-[13px] text-[var(--trench-text-muted)]">›</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />

              {/* Pinned trade */}
              {featured.recentToken && (
                <div className="px-5 py-4">
                  <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">PINNED TRADE</div>
                  <div className="cut-xs" style={{ background: 'rgba(8,12,22,0.6)', border: '1px solid rgba(0,212,255,0.08)', padding: '10px 12px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-white">{featured.recentToken}</span>
                      <span className="text-[12px] font-bold font-mono text-[var(--trench-green)]">{featured.recentPnl}</span>
                    </div>
                    <div className="flex gap-2">
                      {featured.recentBuy && (
                        <div className="cut-xs flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(0,212,255,0.03)' }}>
                          <span className="text-[var(--trench-green)] font-semibold">BUY</span>
                          <span className="text-[var(--trench-text)] font-semibold">{featured.recentBuy} SOL</span>
                        </div>
                      )}
                      {featured.recentSell && (
                        <div className="cut-xs flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(0,212,255,0.03)' }}>
                          <span className="text-[var(--trench-red)] font-semibold">SELL</span>
                          <span className="text-[var(--trench-green)] font-semibold">{featured.recentSell} SOL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-center py-3 border-t border-[rgba(0,212,255,0.06)]">
                <Image src="/logo.png" alt="Web3Me" width={80} height={20} className="h-5 w-auto opacity-30" />
              </div>
            </GlassCard>
          </div>}
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* The Trencher Cup */}
        <section className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16 py-10 sm:py-16">
          <div className="mb-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              The Trencher <span style={{ color: '#00D4FF' }}>Cup</span>
            </h2>
          </div>
          <LeaderboardTable initialPeriod="7d" initialTraders={leaderboardData} />
        </section>

        {/* Journey — merged How it works + Reward Pool */}
        <JourneySection />

        {/* Divider */}
        <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — gallery is the page ending */}
        <section className="relative">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.4) 40%, rgba(5,5,8,0.7) 100%)' }} />

          <div className="mx-auto mb-6 max-w-[780px] px-6 sm:px-12 lg:px-16 relative text-center">
            <h2 className="mb-1 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Top <span className="text-[var(--trench-accent)]">Traders</span></h2>
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
