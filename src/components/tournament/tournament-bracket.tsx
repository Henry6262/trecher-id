'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { buildBracket } from './bracket-utils';
import { GroupStage } from './group-stage';
import { KnockoutBracket } from './knockout-bracket';
import type { RankedTrader } from './bracket-utils';

export function TournamentBracket({ traders }: { traders: RankedTrader[] }) {
  if (traders.length < 32) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <span className="text-[13px] text-[var(--trench-text-muted)] font-mono">
          Not enough traders for bracket (need 32)
        </span>
        <span className="text-[10px] text-[var(--trench-text-muted)]">
          Currently {traders.length} traders ranked
        </span>
      </div>
    );
  }

  const bracket = useMemo(() => buildBracket(traders), [traders]);

  return (
    <div className="space-y-8">
      {/* Champion banner */}
      {bracket.champion && (
        <div
          className="relative flex flex-col items-center py-8 px-6"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.02) 40%, transparent 70%)',
            border: '1px solid rgba(255,215,0,0.1)',
          }}
        >
          <div
            className="text-[10px] font-mono tracking-[3px] mb-4"
            style={{
              color: 'rgba(255,215,0,0.8)',
              animation: 'crownFloat 2s ease-in-out infinite',
            }}
          >
            CHAMPION
          </div>

          <div
            className="rounded-full overflow-hidden mb-3"
            style={{
              width: 56,
              height: 56,
              border: '3px solid rgba(255,215,0,0.5)',
              boxShadow: '0 0 20px rgba(255,215,0,0.15)',
            }}
          >
            <Image
              src={bracket.champion.avatarUrl || `https://unavatar.io/twitter/${bracket.champion.username}`}
              alt={bracket.champion.displayName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>

          <div className="text-[13px] font-bold text-white mb-1">
            @{bracket.champion.username}
          </div>

          <div
            className="text-[16px] font-mono font-black"
            style={{
              color: bracket.champion.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
            }}
          >
            {bracket.champion.pnlUsd >= 0 ? '+' : ''}${Math.abs(bracket.champion.pnlUsd) >= 1000
              ? `${Math.round(bracket.champion.pnlUsd / 1000)}K`
              : Math.round(bracket.champion.pnlUsd)}
          </div>
        </div>
      )}

      {/* Group Stage */}
      <GroupStage groups={bracket.groups} />

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.1)' }} />
        <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
          KNOCKOUT STAGE
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.1)' }} />
      </div>

      {/* Knockout Bracket */}
      <KnockoutBracket rounds={bracket.knockoutRounds} />
    </div>
  );
}
