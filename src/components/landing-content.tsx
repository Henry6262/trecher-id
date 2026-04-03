'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { CutButton } from '@/components/cut-button';
import DecryptedText from '@/components/decrypted-text';
import { GlassCard } from '@/components/glass-card';
import ShinyText from '@/components/shiny-text';
import { TraderCarousel } from '@/components/trader-carousel';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { ActivityTicker } from '@/components/activity-ticker';
import type { TickerItem } from '@/app/api/ticker/route';

const RisingLines = dynamic(() => import('@/components/rising-lines'), { ssr: false });
const DomeGallery = dynamic(() => import('@/components/DomeGallery'), { ssr: false });
const Circles = dynamic(() => import('@/components/circles'), { ssr: false });

type ViewMode = 'scroll' | 'dome' | 'orbits';

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

interface LandingContentProps {
  traders: TraderData[];
  featured: TraderData;
  ticker: TickerItem[];
}

const STEPS = [
  { n: '01', title: 'Sign in with X', desc: 'Connect your Twitter account. Your handle becomes your Web3Me URL.' },
  { n: '02', title: 'Link your wallets', desc: 'Add Solana wallets. We fetch your real trading history from the blockchain.' },
  { n: '03', title: 'Share your link', desc: 'Add custom links, pin your best trades. Drop your Web3Me everywhere.' },
] as const;

export function LandingContent({ traders, featured, ticker }: LandingContentProps) {
  const [traderView, setTraderView] = useState<ViewMode>('scroll');

  // Build avatar arrays for non-scroll views
  const avatarUrls = traders.map(t => t.avatarUrl || `https://unavatar.io/twitter/${t.username}`);
  const domeImages = avatarUrls.map(src => ({ src, alt: '' }));
  // Distribute into 3 orbital rings: inner=2, mid=3, outer=rest
  const orbitRows: string[][] = [
    avatarUrls.slice(0, 2),
    avatarUrls.slice(2, 5),
    avatarUrls.slice(5, 10),
  ].filter(r => r.length > 0);

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
                <DecryptedText text="Web3" speed={80} maxIterations={15} revealDirection="start" animateOn="view" />
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
          <div className="hidden sm:block w-full sm:w-[340px] mx-auto lg:mx-0" style={{ transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)' }}>
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
                  { icon: '𝕏', label: `Follow @${featured.username}` },
                  { icon: '📊', label: 'Trading Dashboard' },
                  { icon: '⚡', label: 'Latest Calls' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2.5 px-3 py-2" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)' }}>
                    <span className="text-[13px]">{l.icon}</span>
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
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-4 sm:px-10">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Leaderboard — traders + deployers */}
        <section className="mx-auto max-w-[900px] px-4 sm:px-10 py-10 sm:py-16">
          <div className="mb-8 text-right">
            <div
              className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono tracking-[2px] text-[var(--trench-accent)]"
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.12)',
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              }}
            >
              LEADERBOARD
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Top <span className="text-[var(--trench-accent)]">Traders</span> &amp; Deployers
            </h2>
            <p className="text-[12px] text-[var(--trench-text-muted)]">
              Ranked by realized PnL. Updated every 4 hours from on-chain data.{' '}
              <Link href="/leaderboard" className="text-[var(--trench-accent)] hover:underline">
                Full leaderboard →
              </Link>
            </p>
          </div>
          <LeaderboardTable initialPeriod="7d" />
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-4 sm:px-10">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-[900px] px-4 sm:px-10 py-10 sm:py-16">
          <h2 className="mb-2 text-2xl font-bold text-white">How it <span className="text-[var(--trench-accent)]">works</span></h2>
          <p className="mb-8 text-[12px] text-[var(--trench-text-muted)]">Three steps. Thirty seconds. Zero cost.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map(step => (
              <GlassCard key={step.n} cut={8} bg="rgba(8,12,18,0.7)">
                <div className="p-5">
                  <div className="mb-2 text-[28px] font-bold text-[var(--trench-accent)]">{step.n}</div>
                  <div className="mb-1 text-[13px] font-bold text-white">{step.title}</div>
                  <div className="text-[10px] leading-relaxed text-[var(--trench-text-muted)]">{step.desc}</div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-4 sm:px-10">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — real data from DB */}
        <section className="py-16">
          <div className="mx-auto mb-8 max-w-[900px] px-4 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="mb-1 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Top <span className="text-[var(--trench-accent)]">traders</span></h2>
                <p className="text-[13px] text-[var(--trench-text-muted)]">Already on Web3Me. Are you?</p>
              </div>
              {/* View toggle */}
              <div className="flex gap-1 flex-wrap">
                {(['scroll', 'dome', 'orbits'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTraderView(mode)}
                    className="px-3 py-1 text-[9px] font-mono tracking-[2px] transition-colors"
                    style={{
                      background: traderView === mode ? 'rgba(0,212,255,0.12)' : 'rgba(0,212,255,0.04)',
                      border: `1px solid ${traderView === mode ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.1)'}`,
                      color: traderView === mode ? 'var(--trench-accent)' : 'var(--trench-text-muted)',
                      clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                    }}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {traderView === 'scroll' && <TraderCarousel traders={traders} />}

          {traderView === 'dome' && (
            <div className="h-[520px] w-full">
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
          )}

          {traderView === 'orbits' && (
            <div className="flex justify-center overflow-hidden py-4">
              <Circles
                rows={orbitRows}
                circleSize={72}
                baseRadius={130}
                orbitGap={110}
                rotationDuration={18}
                alternateDirection
                showPaths
                animate
              />
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-4 sm:px-10">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-[900px] px-4 sm:px-10 py-10 sm:py-16 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Claim your <span className="text-[var(--trench-accent)]">Web3Me</span></h2>
          <p className="mb-6 text-[13px] text-[var(--trench-text-muted)]">Your trading speaks for itself. Let it.</p>
          <CutButton href="/login" size="lg">Create Your Web3Me</CutButton>
        </section>

        {/* Footer */}
        <div className="mx-auto max-w-[900px] border-t border-[rgba(0,212,255,0.06)] px-4 sm:px-10 py-6 text-center">
          <Link href="/" className="mb-2 inline-block">
            <Image src="/logo.png" alt="Web3Me" width={96} height={24} className="mx-auto h-6 w-auto opacity-30 transition-opacity hover:opacity-50" />
          </Link>
          <br />
          <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">WEB3ME &middot; SOLANA &middot; 2026</span>
        </div>
      </div>
    </div>
  );
}
