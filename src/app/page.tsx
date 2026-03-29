'use client';

import dynamic from 'next/dynamic';
import { CutButton } from '@/components/cut-button';
import { Check, Link2, BarChart3, Wallet } from 'lucide-react';

const RisingLines = dynamic(() => import('@/components/rising-lines'), { ssr: false });

const FEATURES = [
  {
    icon: Link2,
    title: 'Custom Links',
    desc: 'Add any link — courses, socials, projects, tip jar. Fully customizable.',
  },
  {
    icon: BarChart3,
    title: 'Verified Trades',
    desc: 'On-chain PnL, win rate, and pinned trades auto-fetched from your wallets.',
  },
  {
    icon: Wallet,
    title: 'Wallet Proof',
    desc: 'Link Solana wallets via Privy. Verified on-chain, no faking it.',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen relative" style={{ background: '#050508' }}>
      {/* RisingLines background — fixed, behind everything */}
      <div className="fixed inset-0 opacity-70" style={{ zIndex: 0 }}>
        <RisingLines
          color="#FF6B00"
          horizonColor="#FF6B00"
          haloColor="#FF8C33"
          riseSpeed={0.06}
          riseScale={8.0}
          riseIntensity={1.5}
          flowSpeed={0.2}
          flowDensity={3.0}
          flowIntensity={0.8}
          horizonIntensity={1.2}
          haloIntensity={5.0}
          horizonHeight={-0.2}
          circleScale={0.5}
          scale={4.0}
          brightness={1.2}
        />
      </div>

      {/* Vignette overlay — fixed, between bg and content */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'radial-gradient(ellipse at center, rgba(5,5,8,0.35) 0%, rgba(5,5,8,0.8) 65%, rgba(5,5,8,0.97) 100%)',
        }}
      />

      {/* Content — above everything */}
      <div className="relative flex flex-col items-center min-h-screen px-4" style={{ zIndex: 2 }}>
        {/* Nav */}
        <nav className="w-full max-w-[560px] flex items-center justify-between py-6">
          <span className="font-mono font-bold text-sm tracking-[3px] text-[var(--trench-orange)]">
            TRENCH ID
          </span>
          <CutButton href="/login" variant="secondary" size="sm">
            Sign in
          </CutButton>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[560px] -mt-16">
          <div className="cut-xs inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-[10px] font-mono tracking-[2px] text-[var(--trench-orange)] bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.12)]">
            <Check size={10} strokeWidth={3} />
            ON-CHAIN VERIFIED
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-mono font-bold text-[var(--trench-text)] mb-4 tracking-tight leading-[0.95]">
            Your Web3
            <br />
            <span className="text-[var(--trench-orange)]">Bio Link</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--trench-text-muted)] max-w-sm mb-8 leading-relaxed">
            Like Linktree, but for traders. Custom links backed by
            verified on-chain trading performance.
          </p>

          <CutButton href="/login" size="lg">
            Create Your Trench ID
          </CutButton>

          <p className="text-[9px] text-[var(--trench-text-muted)] mt-4 tracking-[2px] font-mono">
            FREE &middot; SIGN IN WITH X &middot; 30 SECONDS
          </p>
        </div>

        {/* Features */}
        <div className="w-full max-w-[560px] grid grid-cols-1 sm:grid-cols-3 gap-3 pb-16 mt-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="cut-sm backdrop-blur-md border border-[rgba(255,107,0,0.1)]"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="p-5">
                <div
                  className="w-8 h-8 flex items-center justify-center mb-3 cut-xs"
                  style={{ background: 'rgba(255,107,0,0.1)' }}
                >
                  <Icon size={14} className="text-[var(--trench-orange)]" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[var(--trench-text)] mb-1.5">{title}</h3>
                <p className="text-[11px] text-[var(--trench-text-muted)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="w-full max-w-[560px] border-t border-[var(--trench-border-subtle)] py-6 text-center">
          <span className="text-[9px] text-[var(--trench-text-muted)] font-mono tracking-[2px]">
            TRENCH ID &middot; SOLANA &middot; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
