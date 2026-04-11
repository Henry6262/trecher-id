'use client';

import { MatchupCard } from './matchup-card';
import { BracketConnector } from './bracket-connector';
import type { BracketData, Matchup } from './bracket-utils';

const ROUND_LABELS = {
  r16: 'ROUND OF 16',
  qf: 'QUARTER-FINALS',
  sf: 'SEMI-FINALS',
  final: 'FINAL',
} as const;

function RoundColumn({
  label,
  matchups,
  gap,
}: {
  label: string;
  matchups: Matchup[];
  gap: string;
}) {
  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 220 }}>
      <div className="text-[10px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-4 text-center">
        {label}
      </div>
      <div className="flex flex-col justify-around flex-1" style={{ gap }}>
        {matchups.map((m) => (
          <MatchupCard key={m.id} matchup={m} compact={matchups.length > 4} />
        ))}
      </div>
    </div>
  );
}

export function KnockoutBracket({ rounds }: { rounds: BracketData['knockoutRounds'] }) {
  // Row height and gap for connector calculations
  const ROW_H = 96; // approx height of a matchup card

  return (
    <div className="overflow-x-auto">
      <div className="flex items-stretch" style={{ minWidth: 900 }}>
        {/* R16 */}
        <RoundColumn label={ROUND_LABELS.r16} matchups={rounds.r16} gap="8px" />

        {/* Connector R16 -> QF */}
        <div className="flex items-center flex-shrink-0">
          <BracketConnector matchups={8} rowHeight={ROW_H} gap={8} delay={0} />
        </div>

        {/* QF */}
        <RoundColumn label={ROUND_LABELS.qf} matchups={rounds.qf} gap="32px" />

        {/* Connector QF -> SF */}
        <div className="flex items-center flex-shrink-0">
          <BracketConnector matchups={4} rowHeight={ROW_H} gap={32} delay={0.5} />
        </div>

        {/* SF */}
        <RoundColumn label={ROUND_LABELS.sf} matchups={rounds.sf} gap="96px" />

        {/* Connector SF -> Final */}
        <div className="flex items-center flex-shrink-0">
          <BracketConnector matchups={2} rowHeight={ROW_H} gap={96} delay={1} />
        </div>

        {/* Final */}
        <RoundColumn label={ROUND_LABELS.final} matchups={rounds.final} gap="0px" />
      </div>
    </div>
  );
}
