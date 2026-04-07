import Image from 'next/image';
import Link from 'next/link';
import { BackgroundLayer } from '@/components/background-layer';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { CutButton } from '@/components/cut-button';

export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      {/* Background */}
      <BackgroundLayer />

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Nav */}
        <nav
          style={{
            background: 'rgba(5, 5, 8, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Web3Me"
                width={200}
                height={50}
                className="h-11 w-auto transition-opacity hover:opacity-80"
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-[10px] font-mono tracking-[1px] text-[var(--trench-text-muted)] hover:text-[var(--trench-accent)] transition-colors"
              >
                HOME
              </Link>
              <CutButton href="/login" variant="secondary" size="sm">
                Sign in with X
              </CutButton>
            </div>
          </div>
          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)',
            }}
          />
        </nav>

        {/* Content */}
        <div className="mx-auto max-w-[900px] px-6 pt-10 pb-20">
          {/* Header */}
          <div className="mb-8 text-right">
            <div
              className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono tracking-[2px] text-[var(--trench-accent)]"
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.12)',
                clipPath:
                  'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              }}
            >
              LEADERBOARD
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Top <span className="text-[var(--trench-accent)]">Traders & Devs</span>
            </h1>
            <p className="text-[12px] text-[var(--trench-text-muted)]">
              Toggle between trader and deployer rankings. Updated from indexed on-chain data.
            </p>
          </div>

          <LeaderboardTable initialPeriod="7d" />
        </div>

        {/* Footer */}
        <div className="mx-auto max-w-[900px] border-t border-[rgba(0,212,255,0.06)] px-6 py-6 text-center">
          <Link href="/" className="mb-2 inline-block">
            <Image
              src="/logo.png"
              alt="Web3Me"
              width={96}
              height={24}
              className="mx-auto h-6 w-auto opacity-30 transition-opacity hover:opacity-50"
            />
          </Link>
          <br />
          <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
            WEB3ME &middot; SOLANA &middot; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
