'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CutCorner } from '@/components/cut-corner';
import type { Matchup, RankedTrader } from './bracket-utils';

function TraderRow({
  trader,
  isWinner,
  compact,
}: {
  trader: RankedTrader | null;
  isWinner: boolean;
  compact?: boolean;
}) {
  const avatarSize = compact ? 20 : 28;

  if (!trader) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-2" style={{ opacity: 0.3 }}>
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: avatarSize,
            height: avatarSize,
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.08)',
          }}
        />
        <span className="text-[9px] font-mono text-[var(--trench-text-muted)]">TBD</span>
      </div>
    );
  }

  return (
    <Link
      href={`/${trader.username}`}
      className="flex items-center gap-2 px-2.5 py-2 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
      style={{
        opacity: isWinner ? 1 : 0.4,
        background: isWinner
          ? 'linear-gradient(90deg, rgba(0,212,255,0.08), transparent)'
          : 'transparent',
        borderLeft: isWinner ? '3px solid #00D4FF' : '3px solid transparent',
        // animation removed — too many cards causes GPU thrash
      }}
    >
      {/* Avatar */}
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{
          width: avatarSize,
          height: avatarSize,
          border: '1.5px solid rgba(0,212,255,0.15)',
        }}
      >
        <Image
          src={trader.avatarUrl || `https://unavatar.io/twitter/${trader.username}`}
          alt={trader.displayName}
          width={avatarSize}
          height={avatarSize}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>

      {/* Username */}
      <span className="text-[9px] font-semibold text-white truncate min-w-0 flex-1">
        @{trader.username}
      </span>

      {/* PnL */}
      <span
        className="text-[9px] font-mono font-bold flex-shrink-0"
        style={{
          color: trader.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
          textDecoration: isWinner ? 'none' : 'line-through',
        }}
      >
        {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000
          ? `${(trader.pnlUsd / 1000).toFixed(1)}K`
          : Math.round(trader.pnlUsd)}
      </span>
    </Link>
  );
}

export function MatchupCard({ matchup, compact }: { matchup: Matchup; compact?: boolean }) {
  return (
    <CutCorner cut="xs" bg="rgba(8,12,18,0.7)">
      <TraderRow
        trader={matchup.trader1}
        isWinner={matchup.winner !== null && matchup.trader1 !== null && matchup.winner.username === matchup.trader1.username}
        compact={compact}
      />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
      <TraderRow
        trader={matchup.trader2}
        isWinner={matchup.winner !== null && matchup.trader2 !== null && matchup.winner.username === matchup.trader2.username}
        compact={compact}
      />
    </CutCorner>
  );
}
