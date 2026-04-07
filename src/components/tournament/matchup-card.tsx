'use client';

import Link from 'next/link';
import { AvatarImage } from '@/components/avatar-image';
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
        <AvatarImage
          src={trader.avatarUrl || `https://unavatar.io/twitter/${trader.username}`}
          alt={trader.displayName}
          width={avatarSize}
          height={avatarSize}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Username */}
      <div className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold text-white truncate">
          @{trader.username}
        </span>
        <span className="block text-[7px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
          {isWinner ? 'ADVANCES' : 'ELIMINATED'}
        </span>
      </div>

      <span
        className="text-[7px] font-mono tracking-[1.5px] px-1.5 py-0.5 cut-xs flex-shrink-0"
        style={{
          color: isWinner ? '#00D4FF' : 'rgba(255,255,255,0.45)',
          background: isWinner ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: isWinner ? '1px solid rgba(0,212,255,0.16)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {isWinner ? 'WIN' : 'OUT'}
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
          ? `${Math.round(trader.pnlUsd / 1000)}K`
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
