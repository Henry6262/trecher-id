'use client';

import dynamic from 'next/dynamic';
import { CutButton } from '@/components/cut-button';
import { Check, Link2, BarChart3, Wallet } from 'lucide-react';
import DecryptedText from '@/components/decrypted-text';
import ShinyText from '@/components/shiny-text';
import GradientCarousel from '@/components/react-bits/gradient-carousel';

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

// Top KOLs — avatar images for the carousel
const TOP_TRADERS = [
  { username: 'cented7', name: 'Cented', pnl: '+$11.9K' },
  { username: 'schoen_xyz', name: 'Schoen', pnl: '+$9.0K' },
  { username: 'theonomix', name: 'theo', pnl: '+$7.2K' },
  { username: 'blueycryp', name: 'Bluey', pnl: '+$5.5K' },
  { username: 'imsheepsol', name: 'Sheep', pnl: '+$4.7K' },
  { username: 'ratwizardx', name: 'West', pnl: '+$4.6K' },
  { username: 'saint_pablo123', name: 'Sebastian', pnl: '+$3.7K' },
  { username: 'pandoraflips', name: 'Pandora', pnl: '+$3.3K' },
  { username: 'orangesbs', name: 'Orange', pnl: '+$2.6K' },
  { username: 'vibed333', name: 'dv', pnl: '+$2.6K' },
  { username: 'notdecu', name: 'decu', pnl: '+$1.8K' },
  { username: 'bandeez', name: 'bandit', pnl: '+$0.9K' },
];

const TRADER_IMAGES = TOP_TRADERS.map(t => `https://unavatar.io/twitter/${t.username}`);

export default function LandingPage() {
  return (
    <div className="min-h-screen relative" style={{ background: '#050508' }}>
      {/* RisingLines background */}
      <div className="fixed inset-0 opacity-75" style={{ zIndex: 0 }}>
        <RisingLines
          color="#00D4FF"
          horizonColor="#00D4FF"
          haloColor="#33DDFF"
          riseSpeed={0.08}
          riseScale={10.0}
          riseIntensity={1.3}
          flowSpeed={0.15}
          flowDensity={4.0}
          flowIntensity={0.7}
          horizonIntensity={0.9}
          haloIntensity={7.5}
          horizonHeight={-0.85}
          circleScale={-0.5}
          scale={6.5}
          brightness={1.1}
        />
      </div>

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>

        {/* Nav */}
        <nav className="max-w-[900px] mx-auto flex items-center justify-between px-6 py-5">
          <a href="/" className="cursor-pointer">
            <img src="/logo.png" alt="Trench ID" className="h-10 w-auto hover:opacity-80 transition-opacity" />
          </a>
          <CutButton href="/login" variant="secondary" size="sm">
            Sign in with X
          </CutButton>
        </nav>

        {/* Hero */}
        <section className="max-w-[900px] mx-auto px-6 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="cut-xs inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-[10px] font-mono tracking-[2px] text-[var(--trench-accent)] bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.12)]">
              <Check size={10} strokeWidth={3} />
              <ShinyText text="ON-CHAIN VERIFIED" speed={3} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-white mb-4 tracking-tight leading-[1]">
              Your{' '}
              <span className="text-[var(--trench-accent)]">
                <DecryptedText
                  text="Web3"
                  speed={80}
                  maxIterations={15}
                  revealDirection="start"
                  animateOn="view"
                />
              </span>
              <br />Bio Link
            </h1>

            <p className="text-sm text-[var(--trench-text-muted)] max-w-sm mb-8 leading-relaxed">
              The shareable identity page for Solana traders. Custom links, verified on-chain trading performance, one URL.
            </p>

            <CutButton href="/login" size="lg">
              Create Your Trench ID
            </CutButton>

            <p className="text-[9px] text-[var(--trench-text-muted)] mt-4 tracking-[2px] font-mono">
              FREE &middot; 30 SECONDS &middot; SIGN IN WITH X
            </p>
          </div>

          {/* Mini profile preview on the right */}
          <div
            className="cut-sm hidden lg:block"
            style={{
              background: 'rgba(8,12,18,0.78)',
              border: '1px solid rgba(0,212,255,0.12)',
              padding: '20px',
              transform: 'perspective(800px) rotateY(-3deg) rotateX(2deg)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(0,212,255,0.08)',
            }}
          >
            <div className="flex gap-3 items-center mb-3">
              <div className="w-[52px] h-[52px] rounded-full overflow-hidden" style={{ border: '2px solid rgba(0,212,255,0.3)', boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}>
                <img src="https://unavatar.io/twitter/Cented7" alt="Cented" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-bold text-white">@Cented7</span>
                  <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center" style={{ background: '#00D4FF' }}>
                    <Check size={9} strokeWidth={3} className="text-black" />
                  </div>
                </div>
                <span className="text-[9px] text-[var(--trench-text-muted)]">Solana degen · builder</span>
              </div>
              <span className="text-[8px] text-[var(--trench-text-muted)] font-mono">CyaE...a54o</span>
            </div>

            <div className="flex gap-2 mb-3">
              {[
                { val: '+$11.9K', label: 'PnL', color: 'text-[var(--trench-green)]' },
                { val: '60%', label: 'Win', color: 'text-[var(--trench-accent)]' },
                { val: '144', label: 'Trades', color: 'text-[var(--trench-text)]' },
              ].map(s => (
                <div key={s.label} className="skew-container glass-inner flex items-center gap-1.5 px-2.5 py-1.5 flex-1">
                  <span className={`text-[12px] font-bold font-mono ${s.color}`}>{s.val}</span>
                  <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <div className="skew-container glass-inner flex items-center gap-2 px-3 py-2">
                <span className="text-[var(--trench-accent)] text-[14px]">𝕏</span>
                <span className="text-[11px] flex-1">Follow @Cented7</span>
                <span className="text-[var(--trench-text-muted)] text-[16px]">›</span>
              </div>
              <div className="skew-container glass-inner flex items-center gap-2 px-3 py-2">
                <span className="text-[var(--trench-accent)] text-[12px]">💬</span>
                <span className="text-[11px] flex-1">Telegram Alpha</span>
                <span className="text-[var(--trench-text-muted)] text-[16px]">›</span>
              </div>
            </div>
          </div>
        </section>

        {/* Fading divider */}
        <div className="max-w-[900px] mx-auto px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* How it works */}
        <section className="max-w-[900px] mx-auto px-6 py-16">
          <h2 className="text-2xl font-mono font-bold text-white mb-2">
            How it <span className="text-[var(--trench-accent)]">works</span>
          </h2>
          <p className="text-[12px] text-[var(--trench-text-muted)] mb-8">Three steps. Thirty seconds. Zero cost.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { n: '01', title: 'Sign in with X', desc: 'Connect your Twitter account. Your handle becomes your Trench ID URL.' },
              { n: '02', title: 'Link your wallets', desc: 'Add Solana wallets. We fetch your real trading history from the blockchain.' },
              { n: '03', title: 'Share your link', desc: 'Add custom links, pin your best trades. Drop your Trench ID everywhere.' },
            ].map(step => (
              <div key={step.n} className="cut-sm" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(0,212,255,0.06)', padding: '20px' }}>
                <div className="text-[28px] font-bold text-[var(--trench-accent)] mb-2">{step.n}</div>
                <div className="text-[13px] font-bold text-white mb-1">{step.title}</div>
                <div className="text-[10px] text-[var(--trench-text-muted)] leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Fading divider */}
        <div className="max-w-[900px] mx-auto px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — 3D Carousel */}
        <section className="py-16">
          <div className="max-w-[900px] mx-auto px-6 mb-8">
            <h2 className="text-2xl font-mono font-bold text-white mb-2">
              Top <span className="text-[var(--trench-accent)]">traders</span>
            </h2>
            <p className="text-[12px] text-[var(--trench-text-muted)]">Already on Trench ID. Are you?</p>
          </div>

          <div className="h-[400px] w-full">
            <GradientCarousel
              images={TRADER_IMAGES}
              maxRotationDegrees={25}
              maxDepthPx={120}
              minScale={0.9}
              cardGap={24}
              frictionFactor={0.9}
              wheelSensitivity={0.5}
              dragSensitivity={1.0}
              backgroundBlur={0}
              gradientSize={0}
              gradientIntensity={0}
              enableKeyboard={true}
              cardAspectRatio={1}
              initialIndex={0}
              className="w-full h-full"
            />
          </div>
        </section>

        {/* Fading divider */}
        <div className="max-w-[900px] mx-auto px-6">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Bottom CTA */}
        <section className="max-w-[900px] mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-mono font-bold text-white mb-3">
            Claim your <span className="text-[var(--trench-accent)]">Trench ID</span>
          </h2>
          <p className="text-[13px] text-[var(--trench-text-muted)] mb-6">Your trading speaks for itself. Let it.</p>
          <CutButton href="/login" size="lg">
            Create Your Trench ID
          </CutButton>
        </section>

        {/* Footer */}
        <div className="max-w-[900px] mx-auto px-6 py-6 text-center border-t border-[rgba(0,212,255,0.06)]">
          <a href="/" className="cursor-pointer inline-block mb-2">
            <img src="/logo.png" alt="Trench ID" className="h-6 w-auto opacity-30 mx-auto hover:opacity-50 transition-opacity" />
          </a>
          <br />
          <span className="text-[9px] text-[var(--trench-text-muted)] font-mono tracking-[2px]">
            TRENCH ID &middot; SOLANA &middot; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
