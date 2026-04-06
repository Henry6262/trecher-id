'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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


const MOCK_TRADES = [
  { symbol: '$WIF', pnl: '+312%', buy: '2.4', sell: '9.9', img: 'https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png' },
  { symbol: '$BONK', pnl: '+89%', buy: '5.1', sell: '9.6', img: 'https://dd.dexscreener.com/ds-data/tokens/solana/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263.png' },
  { symbol: '$JUP', pnl: '+156%', buy: '3.0', sell: '7.7', img: 'https://dd.dexscreener.com/ds-data/tokens/solana/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN.png' },
];

function TradeCard({ trade, onHover, onLeave, isHovered }: { trade: typeof MOCK_TRADES[0]; onHover: () => void; onLeave: () => void; isHovered: boolean }) {
  return (
    <div
      className="relative flex-shrink-0 w-[90px] cursor-pointer"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className="p-2.5 flex flex-col items-center gap-1.5 transition-all duration-200"
        style={{
          background: isHovered ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.02)',
          border: isHovered ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
          clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
        }}
      >
        <img src={trade.img} alt={trade.symbol} className="w-8 h-8 rounded-full" />
        <span className="text-[10px] font-bold text-white">{trade.symbol}</span>
        <span className="text-[11px] font-bold font-mono text-[#22c55e]">{trade.pnl}</span>
      </div>

      {/* Hover detail popup */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          >
            <div
              className="w-[160px] p-3 flex flex-col gap-2"
              style={{
                background: 'rgba(8,12,18,0.95)',
                border: '1px solid rgba(0,212,255,0.2)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,212,255,0.08)',
              }}
            >
              <div className="flex items-center gap-2">
                <img src={trade.img} alt="" className="w-7 h-7 rounded-full" />
                <div>
                  <div className="text-[11px] font-bold text-white">{trade.symbol}</div>
                  <div className="text-[13px] font-black font-mono text-[#22c55e]">{trade.pnl}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', clipPath: 'polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px)' }}>
                  <span className="text-[#22c55e] font-semibold">BUY</span>
                  <span className="text-white font-semibold">{trade.buy} SOL</span>
                </div>
                <div className="flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', clipPath: 'polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px)' }}>
                  <span className="text-[#ef4444] font-semibold">SELL</span>
                  <span className="text-[#22c55e] font-semibold">{trade.sell} SOL</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewCardInner({ featured }: { featured: TraderData }) {
  const [hoveredTrade, setHoveredTrade] = useState<number | null>(null);

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
            <span className="text-[11px] text-white font-medium flex-1">My Website</span>
            <ChevronRight size={14} className="text-[rgba(255,255,255,0.2)] flex-shrink-0" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

        {/* Trades carousel — auto-scrolling with hover previews */}
        <div className="py-3">
          <div className="px-5 text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">TRADES</div>
          <div className="overflow-hidden">
            <div
              className="flex gap-2 px-5"
              style={{ animation: hoveredTrade !== null ? 'none' : 'preview-scroll 12s linear infinite' }}
            >
              {[...MOCK_TRADES, ...MOCK_TRADES].map((t, i) => (
                <TradeCard
                  key={i}
                  trade={t}
                  isHovered={hoveredTrade === i}
                  onHover={() => setHoveredTrade(i)}
                  onLeave={() => setHoveredTrade(null)}
                />
              ))}
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
          </div>
          <LeaderboardTable initialPeriod="7d" initialTraders={leaderboardData} />
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
