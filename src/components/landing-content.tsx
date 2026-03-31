'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check, LinkIcon } from 'lucide-react';
import { CutButton } from '@/components/cut-button';
import DecryptedText from '@/components/decrypted-text';
import { GlassCard } from '@/components/glass-card';
import ShinyText from '@/components/shiny-text';
import { TraderCarousel } from '@/components/trader-carousel';
import StaggeredText from '@/components/react-bits/staggered-text';

const RisingLines = dynamic(() => import('@/components/rising-lines'), { ssr: false });
const Lanyard = dynamic(() => import('@/components/lanyard'), { ssr: false });

interface TradeData {
  tokenSymbol: string;
  tokenImageUrl: string | null;
  pnlPercent: string;
  buy: string | null;
  sell: string | null;
}

interface TraderData {
  username: string;
  name: string;
  avatarUrl: string | null;
  pnl: string;
  winRate: string;
  trades: string;
  topTrades: TradeData[];
  recentToken: string | null;
  recentTokenImage: string | null;
  recentPnl: string | null;
  recentBuy: string | null;
  recentSell: string | null;
}

interface LandingContentProps {
  traders: TraderData[];
  featured: TraderData;
  traderCount: number;
  totalPnl: string;
}

const STEPS = [
  { n: '01', title: 'Sign in with X', desc: 'Connect your Twitter account. Your handle becomes your Trench ID URL.' },
  { n: '02', title: 'Link your wallets', desc: 'Add Solana wallets. We fetch your real trading history from the blockchain.' },
  { n: '03', title: 'Share your link', desc: 'Add custom links, pin your best trades. Drop your Trench ID everywhere.' },
] as const;

export function LandingContent({ traders, featured, traderCount, totalPnl }: LandingContentProps) {
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 80) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setNavVisible(false);
      } else if (currentY < lastScrollY.current - 5) {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <div className="fixed inset-0 opacity-75" style={{ zIndex: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(0,212,255,0.06) 0%, #050508 60%)' }}>
        <RisingLines
          color="#00D4FF" horizonColor="#00D4FF" haloColor="#33DDFF"
          riseSpeed={0.08} riseScale={10} riseIntensity={1.3}
          flowSpeed={0.15} flowDensity={4} flowIntensity={0.7}
          horizonIntensity={0.9} haloIntensity={7.5} horizonHeight={-0.85}
          circleScale={-0.5} scale={6.5} brightness={1.1}
        />
      </div>

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Sticky Nav — hide on scroll down, show on scroll up */}
        <nav
          className="fixed top-0 left-0 right-0 transition-transform duration-300 ease-in-out"
          style={{
            zIndex: 50,
            transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
            background: 'rgba(5, 5, 8, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
            <Link href="/">
              <Image src="/logo.png" alt="Trench ID" width={200} height={50} className="h-11 w-auto transition-opacity hover:opacity-80" priority />
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">SOLANA</span>
              <CutButton href="/login" variant="secondary" size="sm">Sign in with X</CutButton>
            </div>
          </div>
          {/* Bottom fade border */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)' }} />
        </nav>

        {/* Spacer for fixed nav */}
        <div className="h-[68px]" />

        {/* Hero */}
        <section className="mx-auto grid max-w-[900px] grid-cols-1 items-center gap-12 px-6 pt-16 pb-12 lg:grid-cols-2">
          <div>
            <div className="cut-xs mb-6 inline-flex items-center gap-1.5 border border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.08)] px-3 py-1 text-[10px] font-mono tracking-[2px] text-[var(--trench-accent)]">
              <Check size={10} strokeWidth={3} />
              <ShinyText text="ON-CHAIN VERIFIED" speed={3} />
            </div>

            <h1 className="mb-4 text-4xl leading-[1] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your ultimate{' '}
              <span className="text-[var(--trench-accent)]">
                <DecryptedText text="Trench" speed={80} maxIterations={15} revealDirection="start" animateOn="view" />
              </span>
              <br />Identity
            </h1>

            <p className="mb-8 max-w-sm text-sm leading-relaxed text-[var(--trench-text-muted)]">
              One link for your on-chain reputation. Verified trades, custom links, shareable profile. Built for Solana degens.
            </p>

            <CutButton href="/login" size="lg">Create Your Trench ID</CutButton>
            <p className="mt-4 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">FREE &middot; 30 SECONDS &middot; SIGN IN WITH X</p>
          </div>

          {/* Preview card — Variant B: Dramatic Depth */}
          <div className="hidden lg:block" style={{ position: 'relative' }}>
            {/* Depth shadow layers */}
            <div className="absolute" style={{ inset: '8px 4px -8px 4px', background: 'rgba(0,212,255,0.03)', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)', filter: 'blur(2px)' }} />
            <div className="absolute" style={{ inset: '16px 8px -16px 8px', background: 'rgba(0,212,255,0.02)', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)', filter: 'blur(4px)' }} />

            <div className="relative" style={{ transform: 'perspective(800px) rotateY(-5deg) rotateX(3deg)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.08)' }}>
              <GlassCard cut={12} glow={true}>
                {/* Accent top bar */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--trench-accent), transparent 80%)' }} />

                <div className="p-6">
                  {/* Profile row */}
                  <div className="mb-4 flex items-center gap-3.5">
                    <div className="h-[80px] w-[80px] overflow-hidden rounded-full flex-shrink-0 animate-[pulseGlow_3s_ease-in-out_infinite]" style={{ border: '2.5px solid rgba(0,212,255,0.45)', boxShadow: '0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)' }}>
                      <Image
                        src={featured.avatarUrl || `https://unavatar.io/twitter/${featured.username}`}
                        alt={featured.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[18px] font-extrabold text-white">@{featured.username}</span>
                        <div className="flex h-[16px] w-[16px] items-center justify-center rounded-full" style={{ background: '#00D4FF' }}>
                          <Check size={9} strokeWidth={3} className="text-black" />
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--trench-text-muted)]">{featured.name}</span>
                      <div className="flex gap-1 mt-1.5">
                        <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold text-[var(--trench-accent)]" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.12)' }}>VERIFIED</span>
                        <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold text-[var(--trench-green)]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)' }}>TOP TRADER</span>
                      </div>
                    </div>
                  </div>

                  {/* Hero PnL number */}
                  <div className="text-center mb-3.5 py-3" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.04), transparent)' }}>
                    <div className="font-mono text-[32px] font-extrabold text-[var(--trench-green)] leading-none" style={{ textShadow: '0 0 30px rgba(34,197,94,0.3)' }}>{featured.pnl}</div>
                    <div className="text-[8px] tracking-[2px] text-[var(--trench-text-muted)] mt-1">TOTAL REALIZED PnL</div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-2 mb-3.5">
                    {[
                      { val: featured.winRate, label: 'WIN RATE', color: 'text-[var(--trench-accent)]' },
                      { val: featured.trades, label: 'TRADES', color: 'text-[var(--trench-text)]' },
                    ].map(s => (
                      <div key={s.label} className="skew-container glass-inner flex flex-1 items-center gap-1.5 px-2.5 py-1.5">
                        <span className={`font-mono text-[12px] font-bold ${s.color}`}>{s.val}</span>
                        <span className="text-[7px] tracking-[1px] text-[var(--trench-text-muted)]">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />

                  {/* Best trade */}
                  {featured.recentToken && (
                    <div className="cut-xs mt-3 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.06)', padding: '10px 12px' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#111', border: '1.5px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {featured.recentTokenImage ? (
                              <Image src={featured.recentTokenImage} alt={featured.recentToken} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <span className="text-[9px] font-bold text-[var(--trench-accent)]">{featured.recentToken.replace('$', '').slice(0, 2)}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[13px] font-bold text-white">{featured.recentToken}</span>
                            <div className="text-[7px] text-[var(--trench-text-muted)]">Pinned Trade</div>
                          </div>
                        </div>
                        <span className="font-mono text-[14px] font-extrabold text-[var(--trench-green)]">{featured.recentPnl}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {featured.recentBuy && (
                          <div className="cut-xs flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(0,212,255,0.02)' }}>
                            <span className="text-[var(--trench-green)] font-semibold">BUY</span>
                            <span className="font-mono text-[var(--trench-text)] font-semibold">{featured.recentBuy} SOL</span>
                          </div>
                        )}
                        {featured.recentSell && (
                          <div className="cut-xs flex-1 flex justify-between text-[8px] px-2 py-1" style={{ background: 'rgba(0,212,255,0.02)' }}>
                            <span className="text-[var(--trench-red)] font-semibold">SELL</span>
                            <span className="font-mono text-[var(--trench-green)] font-semibold">{featured.recentSell} SOL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Link row */}
                  <div className="skew-container glass-inner flex items-center gap-2 px-3 py-2 mb-2">
                    <span className="text-[14px] text-[var(--trench-accent)]">𝕏</span>
                    <span className="flex-1 text-[11px]">Follow @{featured.username}</span>
                    <span className="text-[16px] text-[var(--trench-text-muted)]">›</span>
                  </div>

                  {/* URL bar */}
                  <div className="cut-xs flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
                    <LinkIcon size={12} className="text-[var(--trench-accent)]" />
                    <span className="font-mono text-[11px] text-[var(--trench-accent)] font-medium">trenchid.xyz/{featured.username}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[900px] px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-[900px] px-6 py-16 text-center">
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
        <section className="py-16">
          <div className="mx-auto mb-10 max-w-[900px] px-6 text-center">
            <h2 className="mb-3 text-3xl sm:text-4xl font-bold text-white">
              <StaggeredText
                text="Top traders"
                as="span"
                segmentBy="chars"
                delay={30}
                duration={0.5}
                direction="bottom"
                staggerDirection="center"
                threshold={0.3}
                blur
                className="inline-block"
              />
            </h2>
            <p className="text-[13px] text-[var(--trench-text-muted)] mb-3">Already on Trench ID. Are you?</p>
            <div className="flex justify-center gap-4">
              <span className="font-mono text-[11px] text-[var(--trench-text-muted)]">
                <span className="text-[var(--trench-accent)] font-semibold">{traderCount}</span> traders
              </span>
              <span className="text-[rgba(0,212,255,0.2)]">|</span>
              <span className="font-mono text-[11px] text-[var(--trench-text-muted)]">
                <span className="text-[var(--trench-green)] font-semibold">{totalPnl}+</span> total PnL
              </span>
            </div>
          </div>
          <TraderCarousel traders={traders} />
        </section>

        {/* Bottom CTA — Split: Lanyard left, CTA right */}
        <section className="relative py-20 px-6">
          {/* Dark overlay behind the whole section */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.4) 100%)' }} />
          {/* Accent glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(0,212,255,0.06) 0%, transparent 50%)' }} />

          {/* Top accent line */}
          <div className="relative h-px mx-auto max-w-[400px] mb-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)' }} />

          <div className="relative mx-auto max-w-[900px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Lanyard — left on desktop, bottom on mobile */}
            <div className="order-2 lg:order-1 h-[500px] lg:h-[600px]">
              <Lanyard
                position={[0, 0, 24]}
                gravity={[0, -40, 0]}
                profile={featured.username !== 'trenchid' ? {
                  username: featured.username,
                  name: featured.name,
                  avatarUrl: featured.avatarUrl,
                  pnl: featured.pnl,
                  winRate: featured.winRate,
                } : undefined}
              />
            </div>

            {/* CTA content — right on desktop, top on mobile */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              {/* Stacked avatars */}
              {traders.length > 0 && (
                <div className="flex justify-center lg:justify-start mb-5">
                  <div className="flex">
                    {traders.slice(0, 4).map((t, i) => (
                      <div
                        key={t.username}
                        className="rounded-full overflow-hidden flex-shrink-0"
                        style={{
                          width: 36, height: 36,
                          border: '2px solid rgba(0,212,255,0.3)',
                          boxShadow: '0 0 16px rgba(0,212,255,0.15)',
                          marginRight: i < 3 ? '-8px' : '0',
                          position: 'relative',
                          zIndex: 5 - i,
                        }}
                      >
                        <Image
                          src={t.avatarUrl || `https://unavatar.io/twitter/${t.username}`}
                          alt={t.name}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 36, height: 36,
                        background: 'rgba(0,212,255,0.12)',
                        border: '2px solid rgba(0,212,255,0.3)',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <span className="font-mono text-[9px] font-bold text-[var(--trench-accent)]">+{Math.max(traderCount - 4, 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[12px] text-[var(--trench-text-muted)] mb-2">Join {traderCount} traders already on Trench ID</p>

              <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 leading-none">
                Let your <span className="text-[var(--trench-accent)]">PnL</span> talk.
              </h2>
              <p className="text-[16px] text-[var(--trench-text-muted)] mb-9">One link. Verified on-chain. Drop it everywhere.</p>

              <CutButton href="/login" size="sm">Create Your Trench ID</CutButton>
              <p className="mt-3 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">FREE &middot; 30 SECONDS &middot; SIGN IN WITH X</p>
            </div>
          </div>

          {/* Bottom line */}
          <div className="h-px mx-auto max-w-[300px] mt-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
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
