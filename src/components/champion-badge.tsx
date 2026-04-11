'use client';

import { Trophy } from 'lucide-react';

export function ChampionBadge({ seasons }: { seasons: number[] }) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 cut-xs"
      style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
        border: '1px solid rgba(255,215,0,0.25)',
      }}
    >
      <Trophy size={10} style={{ color: '#FFD700' }} />
      <span className="text-[8px] font-mono tracking-[1px] font-bold" style={{ color: '#FFD700' }}>
        {seasons.length === 1
          ? `SEASON ${seasons[0]} CHAMPION`
          : `${seasons.length}X CHAMPION`}
      </span>
    </div>
  );
}

export function ChampionCrown({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-block"
      style={{
        color: '#FFD700',
        filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.4))',
        fontSize: size,
      }}
    >
      👑
    </span>
  );
}
