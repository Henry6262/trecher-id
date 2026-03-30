'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { CutButton } from '@/components/cut-button';
import DecryptedText from '@/components/decrypted-text';
import { GlassCard } from '@/components/glass-card';
import ShinyText from '@/components/shiny-text';
import { TraderCarousel } from '@/components/trader-carousel';

const RisingLines = dynamic(() => import('@/components/rising-lines'), { ssr: false });

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
}

const STEPS = [
  { n: '01', title: 'Sign in with X', desc: 'Connect your Twitter account. Your handle becomes your Trench ID URL.' },
  { n: '02', title: 'Link your wallets', desc: 'Add Solana wallets. We fetch your real trading history from the blockchain.' },
  { n: '03', title: 'Share your link', desc: 'Add custom links, pin your best trades. Drop your Trench ID everywhere.' },
] as const;

export function LandingContent({ traders, featured }: LandingContentProps) {
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
        {/* Nav */}
        <nav className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-5">
          <Link href="/">
            <Image src="/logo.png" alt="Trench ID" width={160} height={40} className="h-10 w-auto transition-opacity hover:opacity-80" priority />
          </Link>
          <CutButton href="/login" variant="secondary" size="sm">Sign in with X</CutButton>
        </nav>

        {/* Hero */}
        <section className="mx-auto grid max-w-[900px] grid-cols-1 items-center gap-12 px-6 pt-16 pb-12 lg:grid-cols-2">
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

            <CutButton href="/login" size="lg">Create Your Trench ID</CutButton>
            <p className="mt-4 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">FREE &middot; 30 SECONDS &middot; SIGN IN WITH X</p>
          </div>

          {/* Preview card — real data */}
          <div className="hidden lg:block" style={{ transform: 'perspective(800px) rotateY(-3deg) rotateX(2deg)' }}>
            <GlassCard cut={12}>
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-[52px] w-[52px] overflow-hidden rounded-full" style={{ border: '2px solid rgba(0,212,255,0.3)', boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}>
                    <Image
                      src={featured.avatarUrl || `https://unavatar.io/twitter/${featured.username}`}
                      alt={featured.name}
                      width={52}
                      height={52}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16px] font-bold text-white">@{featured.username}</span>
                      <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full" style={{ background: '#00D4FF' }}>
                        <Check size={9} strokeWidth={3} className="text-black" />
                      </div>
                    </div>
                    <span className="text-[9px] text-[var(--trench-text-muted)]">{featured.name}</span>
                  </div>
                </div>

                <div className="mb-3 flex gap-2">
                  {[
                    { val: featured.pnl, label: 'PnL', color: 'text-[var(--trench-green)]' },
                    { val: featured.winRate, label: 'Win', color: 'text-[var(--trench-accent)]' },
                    { val: featured.trades, label: 'Trades', color: 'text-[var(--trench-text)]' },
                  ].map(s => (
                    <div key={s.label} className="skew-container glass-inner flex flex-1 items-center gap-1.5 px-2.5 py-1.5">
                      <span className={`font-mono text-[12px] font-bold ${s.color}`}>{s.val}</span>
                      <span className="text-[7px] tracking-[1px] text-[var(--trench-text-muted)]">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Real recent trade if available */}
                {featured.recentToken && (
                  <div className="cut-xs mb-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.06)', padding: '8px 10px' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-white">{featured.recentToken}</span>
                      <span className="text-[11px] font-bold font-mono text-[var(--trench-green)]">{featured.recentPnl}</span>
                    </div>
                    <div className="flex gap-2">
                      {featured.recentBuy && (
                        <div className="cut-xs flex-1 flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.02)' }}>
                          <span className="text-[var(--trench-green)] font-semibold">BUY</span>
                          <span className="text-[var(--trench-text)] font-semibold">{featured.recentBuy} SOL</span>
                        </div>
                      )}
                      {featured.recentSell && (
                        <div className="cut-xs flex-1 flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.02)' }}>
                          <span className="text-[var(--trench-red)] font-semibold">SELL</span>
                          <span className="text-[var(--trench-green)] font-semibold">{featured.recentSell} SOL</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="skew-container glass-inner flex items-center gap-2 px-3 py-2">
                    <span className="text-[14px] text-[var(--trench-accent)]">𝕏</span>
                    <span className="flex-1 text-[11px]">Follow @{featured.username}</span>
                    <span className="text-[16px] text-[var(--trench-text-muted)]">›</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-[900px] px-6 py-16">
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
        <div className="mx-auto max-w-[900px] px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — real data from DB */}
        <section className="overflow-hidden py-16">
          <div className="mx-auto mb-10 max-w-[900px] px-6 text-center">
            <h2 className="mb-3 text-3xl sm:text-4xl font-bold text-white">Top <span className="text-[var(--trench-accent)]">traders</span></h2>
            <p className="text-[13px] text-[var(--trench-text-muted)]">Already on Trench ID. Are you?</p>
          </div>
          <TraderCarousel traders={traders} />
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-[900px] px-6 py-16 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Claim your <span className="text-[var(--trench-accent)]">Trench ID</span></h2>
          <p className="mb-6 text-[13px] text-[var(--trench-text-muted)]">Your trading speaks for itself. Let it.</p>
          <CutButton href="/login" size="lg">Create Your Trench ID</CutButton>
        </section>

        {/* Footer */}
        <div className="mx-auto max-w-[900px] border-t border-[rgba(0,212,255,0.06)] px-6 py-6 text-center">
          <Link href="/" className="mb-2 inline-block">
            <Image src="/logo.png" alt="Trench ID" width={96} height={24} className="mx-auto h-6 w-auto opacity-30 transition-opacity hover:opacity-50" />
          </Link>
          <br />
          <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">TRENCH ID &middot; SOLANA &middot; 2026</span>
        </div>
      </div>
    </div>
  );
}
