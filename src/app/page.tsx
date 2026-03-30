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

const RisingLines = dynamic(() => import('@/components/rising-lines'), {
  ssr: false,
});

const TOP_TRADERS = [
  { username: 'cented7', name: 'Cented', pnl: '+$11.9K', winRate: '60%', trades: '144', recentToken: '$PEPE', recentPnl: '+340%', recentBuy: '1.2', recentSell: '5.4' },
  { username: 'schoen_xyz', name: 'Schoen', pnl: '+$9.0K', winRate: '47%', trades: '19', recentToken: '$WIF', recentPnl: '+180%', recentBuy: '2.0', recentSell: '5.6' },
  { username: 'theonomix', name: 'theo', pnl: '+$7.2K', winRate: '44%', trades: '140', recentToken: '$BONK', recentPnl: '+95%', recentBuy: '3.5', recentSell: '6.8' },
  { username: 'blueycryp', name: 'Bluey', pnl: '+$5.5K', winRate: '13%', trades: '30', recentToken: '$JUP', recentPnl: '+62%', recentBuy: '4.0', recentSell: '6.5' },
  { username: 'imsheepsol', name: 'Sheep', pnl: '+$4.7K', winRate: '82%', trades: '39', recentToken: '$RAY', recentPnl: '+210%', recentBuy: '1.5', recentSell: '4.7' },
  { username: 'ratwizardx', name: 'West', pnl: '+$4.6K', winRate: '41%', trades: '95', recentToken: '$ORCA', recentPnl: '+78%', recentBuy: '2.8', recentSell: '5.0' },
  { username: 'saint_pablo123', name: 'Sebastian', pnl: '+$3.7K', winRate: '60%', trades: '5', recentToken: '$PYTH', recentPnl: '+420%', recentBuy: '0.8', recentSell: '4.2' },
  { username: 'pandoraflips', name: 'Pandora', pnl: '+$3.3K', winRate: '80%', trades: '5', recentToken: '$DRIFT', recentPnl: '+150%', recentBuy: '1.0', recentSell: '2.5' },
  { username: 'orangesbs', name: 'Orange', pnl: '+$2.6K', winRate: '36%', trades: '25', recentToken: '$W', recentPnl: '+88%', recentBuy: '2.2', recentSell: '4.1' },
  { username: 'vibed333', name: 'dv', pnl: '+$2.6K', winRate: '49%', trades: '112', recentToken: '$POPCAT', recentPnl: '+55%', recentBuy: '3.0', recentSell: '4.7' },
  { username: 'notdecu', name: 'decu', pnl: '+$1.8K', winRate: '46%', trades: '114', recentToken: '$SAMO', recentPnl: '+120%', recentBuy: '1.2', recentSell: '2.6' },
  { username: 'bandeez', name: 'bandit', pnl: '+$0.9K', winRate: '45%', trades: '95', recentToken: '$MEME', recentPnl: '+45%', recentBuy: '2.5', recentSell: '3.6' },
] as const;

const PREVIEW_STATS = [
  { val: '+$11.9K', label: 'PnL', color: 'text-[var(--trench-green)]' },
  { val: '60%', label: 'Win', color: 'text-[var(--trench-accent)]' },
  { val: '144', label: 'Trades', color: 'text-[var(--trench-text)]' },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Sign in with X',
    desc: 'Connect your Twitter account. Your handle becomes your Trench ID URL.',
  },
  {
    n: '02',
    title: 'Link your wallets',
    desc: 'Add Solana wallets. We fetch your real trading history from the blockchain.',
  },
  {
    n: '03',
    title: 'Share your link',
    desc: 'Add custom links, pin your best trades. Drop your Trench ID everywhere.',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <div className="fixed inset-0 opacity-75" style={{ zIndex: 0 }}>
        <RisingLines
          color="#00D4FF"
          horizonColor="#00D4FF"
          haloColor="#33DDFF"
          riseSpeed={0.08}
          riseScale={10}
          riseIntensity={1.3}
          flowSpeed={0.15}
          flowDensity={4}
          flowIntensity={0.7}
          horizonIntensity={0.9}
          haloIntensity={7.5}
          horizonHeight={-0.85}
          circleScale={-0.5}
          scale={6.5}
          brightness={1.1}
        />
      </div>

      <div className="relative" style={{ zIndex: 2 }}>
        <nav className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-5">
          <Link href="/" className="cursor-pointer">
            <Image
              src="/logo.png"
              alt="Trench ID"
              width={160}
              height={40}
              className="h-10 w-auto transition-opacity hover:opacity-80"
              priority
            />
          </Link>
          <CutButton href="/login" variant="secondary" size="sm">
            Sign in with X
          </CutButton>
        </nav>

        <section className="mx-auto grid max-w-[900px] grid-cols-1 items-center gap-12 px-6 pt-16 pb-12 lg:grid-cols-2">
          <div>
            <div className="cut-xs mb-6 inline-flex items-center gap-1.5 border border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.08)] px-3 py-1 text-[10px] font-mono tracking-[2px] text-[var(--trench-accent)]">
              <Check size={10} strokeWidth={3} />
              <ShinyText text="ON-CHAIN VERIFIED" speed={3} />
            </div>

            <h1 className="mb-4 text-4xl leading-[1] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
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
              <br />
              Bio Link
            </h1>

            <p className="mb-8 max-w-sm text-sm leading-relaxed text-[var(--trench-text-muted)]">
              The shareable identity page for Solana traders. Custom links, verified
              on-chain trading performance, one URL.
            </p>

            <CutButton href="/login" size="lg">
              Create Your Trench ID
            </CutButton>

            <p className="mt-4 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
              FREE &middot; 30 SECONDS &middot; SIGN IN WITH X
            </p>
          </div>

          <div
            className="hidden lg:block"
            style={{ transform: 'perspective(800px) rotateY(-3deg) rotateX(2deg)' }}
          >
            <GlassCard cut={12}>
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="h-[52px] w-[52px] overflow-hidden rounded-full"
                    style={{
                      border: '2px solid rgba(0,212,255,0.3)',
                      boxShadow: '0 0 20px rgba(0,212,255,0.2)',
                    }}
                  >
                    <Image
                      src="https://unavatar.io/twitter/Cented7"
                      alt="Cented"
                      width={52}
                      height={52}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16px] font-bold text-white">@Cented7</span>
                      <div
                        className="flex h-[14px] w-[14px] items-center justify-center rounded-full"
                        style={{ background: '#00D4FF' }}
                      >
                        <Check size={9} strokeWidth={3} className="text-black" />
                      </div>
                    </div>
                    <span className="text-[9px] text-[var(--trench-text-muted)]">
                      Solana degen · builder
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-[var(--trench-text-muted)]">
                    CyaE...a54o
                  </span>
                </div>

                <div className="mb-3 flex gap-2">
                  {PREVIEW_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="skew-container glass-inner flex flex-1 items-center gap-1.5 px-2.5 py-1.5"
                    >
                      <span className={`font-mono text-[12px] font-bold ${stat.color}`}>
                        {stat.val}
                      </span>
                      <span className="text-[7px] tracking-[1px] text-[var(--trench-text-muted)]">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="skew-container glass-inner flex items-center gap-2 px-3 py-2">
                    <span className="text-[14px] text-[var(--trench-accent)]">𝕏</span>
                    <span className="flex-1 text-[11px]">Follow @Cented7</span>
                    <span className="text-[16px] text-[var(--trench-text-muted)]">›</span>
                  </div>
                  <div className="skew-container glass-inner flex items-center gap-2 px-3 py-2">
                    <span className="text-[12px] text-[var(--trench-accent)]">💬</span>
                    <span className="flex-1 text-[11px]">Telegram Alpha</span>
                    <span className="text-[16px] text-[var(--trench-text-muted)]">›</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>


        <div className="mx-auto max-w-[900px] px-6">
          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)',
            }}
          />
        </div>

        <section className="mx-auto max-w-[900px] px-6 py-16">
          <h2 className="mb-2 text-2xl font-bold text-white">
            How it <span className="text-[var(--trench-accent)]">works</span>
          </h2>
          <p className="mb-8 text-[12px] text-[var(--trench-text-muted)]">
            Three steps. Thirty seconds. Zero cost.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <GlassCard key={step.n} cut={8} bg="rgba(8,12,18,0.7)">
                <div className="p-5">
                  <div className="mb-2 text-[28px] font-bold text-[var(--trench-accent)]">
                    {step.n}
                  </div>
                  <div className="mb-1 text-[13px] font-bold text-white">
                    {step.title}
                  </div>
                  <div className="text-[10px] leading-relaxed text-[var(--trench-text-muted)]">
                    {step.desc}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[900px] px-6">
          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)',
            }}
          />
        </div>

        <section className="overflow-hidden py-16">
          <div className="mx-auto mb-8 max-w-[900px] px-6">
            <h2 className="mb-2 text-2xl font-bold text-white">
              Top <span className="text-[var(--trench-accent)]">traders</span>
            </h2>
            <p className="text-[12px] text-[var(--trench-text-muted)]">
              Already on Trench ID. Are you?
            </p>
          </div>

          <TraderCarousel traders={TOP_TRADERS} />
        </section>

        <div className="mx-auto max-w-[900px] px-6">
          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)',
            }}
          />
        </div>

        <section className="mx-auto max-w-[900px] px-6 py-16 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">
            Claim your <span className="text-[var(--trench-accent)]">Trench ID</span>
          </h2>
          <p className="mb-6 text-[13px] text-[var(--trench-text-muted)]">
            Your trading speaks for itself. Let it.
          </p>
          <CutButton href="/login" size="lg">
            Create Your Trench ID
          </CutButton>
        </section>

        <div className="mx-auto max-w-[900px] border-t border-[rgba(0,212,255,0.06)] px-6 py-6 text-center">
          <Link href="/" className="mb-2 inline-block cursor-pointer">
            <Image
              src="/logo.png"
              alt="Trench ID"
              width={96}
              height={24}
              className="mx-auto h-6 w-auto opacity-30 transition-opacity hover:opacity-50"
            />
          </Link>
          <br />
          <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
            TRENCH ID &middot; SOLANA &middot; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
