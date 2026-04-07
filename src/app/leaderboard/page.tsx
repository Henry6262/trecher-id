import Link from 'next/link';
import { BackgroundLayer } from '@/components/background-layer';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { CutButton } from '@/components/cut-button';
import { PublicNav } from '@/components/public-nav';

export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <PublicNav />

      {/* Background */}
      <BackgroundLayer />

      <div className="relative" style={{ zIndex: 2 }}>
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
          <div className="mb-2">
            <CutButton href="/login" variant="secondary" size="sm">
              Sign in with X
            </CutButton>
          </div>
          <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
            WEB3ME &middot; SOLANA &middot; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
