'use client';

import { useState } from 'react';
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


// ─── Preview Card with Calendar/Chart toggle ───────────────

const CALENDAR_DATA = Array.from({ length: 56 }, (_, i) => {
  const rand = Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5; // deterministic pseudo-random
  const trades = rand > 0.7 ? Math.floor(rand * 12) + 3 : rand > 0.3 ? Math.floor(rand * 5) + 1 : 0;
  const pnl = trades > 0 ? Math.round((rand - 0.35) * 800) : 0;
  const opacity = trades === 0 ? 0.05 : trades > 6 ? 0.8 : trades > 2 ? 0.4 : 0.15;
  const daysAgo = 55 - i;
  const date = new Date(Date.now() - daysAgo * 86400000);
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { opacity, trades, pnl, label };
});

function MiniCalendar() {
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
      {CALENDAR_DATA.map((cell, i) => (
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

function MiniSparkline() {
  return (
    <svg viewBox="0 0 280 40" className="w-full" style={{ height: 40 }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,197,94,0.3)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0)" />
        </linearGradient>
      </defs>
      <path d="M0 35 Q20 32, 40 28 T80 24 T120 20 T160 16 T200 10 T240 8 T280 4" fill="none" stroke="#22c55e" strokeWidth="1.5" />
      <path d="M0 35 Q20 32, 40 28 T80 24 T120 20 T160 16 T200 10 T240 8 T280 4 V40 H0 Z" fill="url(#sparkFill)" />
    </svg>
  );
}

function PreviewCard({ featured }: { featured: TraderData }) {
  const [chartView, setChartView] = useState<'calendar' | 'chart'>('calendar');

  return (
    <div className="hidden sm:block w-full sm:w-[340px] mx-auto lg:mx-0" style={{ transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)' }}>
      {/* Banner strip */}
      <div className="h-[32px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a12 100%)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.06), transparent)' }} />
      </div>

      {/* Main card */}
      <GlassCard cut={0} bg="rgba(8,12,18,0.82)">
        {/* Profile header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar — cut corner style */}
            <div className="relative flex-shrink-0">
              <div className="overflow-hidden" style={{ width: 56, height: 56, clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' }}>
                <Image
                  src={featured.avatarUrl || `https://unavatar.io/twitter/${featured.username}`}
                  alt={featured.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Verified badge */}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full" style={{ background: '#00D4FF', border: '2px solid rgba(8,12,18,0.9)' }}>
                <Check size={8} strokeWidth={3} className="text-black" />
              </div>
            </div>

            {/* Name + handle + PnL */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[14px] font-bold text-white leading-tight truncate">{featured.name}</span>
                <span className="text-[7px] font-mono tracking-[1px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.08)', color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.12)' }}>SOLANA TRADER</span>
              </div>
              <div className="text-[10px] text-[var(--trench-text-muted)] mb-2">@{featured.username}</div>
              <div className="text-[20px] font-black font-mono" style={{ color: '#22c55e', textShadow: '0 0 12px rgba(34,197,94,0.2)' }}>{featured.pnl}</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-2 mb-1">
            {[
              { val: featured.pnl, label: 'TOTAL PnL', color: 'var(--trench-green)' },
              { val: featured.winRate, label: 'WIN RATE', color: 'white' },
              { val: featured.trades, label: 'TRADES', color: 'white' },
            ].map(s => (
              <div key={s.label} className="flex-1 flex flex-col items-center py-2 px-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' }}>
                <span className="font-mono text-[12px] font-bold" style={{ color: s.color }}>{s.val}</span>
                <span className="text-[6px] tracking-[1px] text-[var(--trench-text-muted)] mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)' }} />

        {/* Calendar / Chart toggle section */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
              {chartView === 'calendar' ? 'TRADE ACTIVITY' : 'PnL HISTORY'}
            </span>
            <div className="flex gap-0.5 p-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <button
                onClick={() => setChartView('calendar')}
                className="px-2 py-0.5 text-[7px] font-mono tracking-[1px] transition-all rounded-[3px]"
                style={{
                  background: chartView === 'calendar' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: chartView === 'calendar' ? 'white' : '#555',
                }}
              >
                GRID
              </button>
              <button
                onClick={() => setChartView('chart')}
                className="px-2 py-0.5 text-[7px] font-mono tracking-[1px] transition-all rounded-[3px]"
                style={{
                  background: chartView === 'chart' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: chartView === 'chart' ? 'white' : '#555',
                }}
              >
                CHART
              </button>
            </div>
          </div>
          {chartView === 'calendar' ? <MiniCalendar /> : <MiniSparkline />}
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

        {/* Pinned trade */}
        {featured.recentToken && (
          <div className="px-5 py-4">
            <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">PINNED TRADE</div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-white">{featured.recentToken}</span>
                <span className="text-[12px] font-bold font-mono text-[var(--trench-green)]">{featured.recentPnl}</span>
              </div>
              <div className="flex gap-2">
                {featured.recentBuy && (
                  <div className="flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(255,255,255,0.02)', clipPath: 'polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px)' }}>
                    <span className="text-[var(--trench-green)] font-semibold">BUY</span>
                    <span className="text-white font-semibold">{featured.recentBuy} SOL</span>
                  </div>
                )}
                {featured.recentSell && (
                  <div className="flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(255,255,255,0.02)', clipPath: 'polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px)' }}>
                    <span className="text-[var(--trench-red)] font-semibold">SELL</span>
                    <span className="text-[var(--trench-green)] font-semibold">{featured.recentSell} SOL</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-center py-3 border-t border-[rgba(255,255,255,0.04)]">
          <Image src="/logo.png" alt="Web3Me" width={80} height={20} className="h-5 w-auto opacity-30" />
        </div>
      </GlassCard>
    </div>
  );
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
                <span className="relative inline-block" style={{ width: 90, verticalAlign: 'baseline' }}>
                  <img src="/logo.png" alt="" className="!max-w-none absolute" style={{ width: 100, height: 'auto', top: '50%', left: -6, transform: 'translateY(-50%)', filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.3))' }} />
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
          {featured && <PreviewCard featured={featured} />}
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* The Trencher Cup */}
        <section className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16 py-10 sm:py-16">
          <div className="mb-8 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
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
