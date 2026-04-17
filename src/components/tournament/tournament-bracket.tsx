'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
import { ParticipateButton } from './participate-button';
import { buildBracket } from './bracket-utils';
import { GroupCard } from './group-card';
import { KnockoutBracket } from './knockout-bracket';
import { MatchupCard } from './matchup-card';
import type { RankedTrader, Matchup } from './bracket-utils';

type TournamentPhase = 'groups' | 'r16' | 'qf' | 'sf' | 'final' | 'all';

const PHASES: { key: TournamentPhase; label: string }[] = [
  { key: 'groups', label: 'GROUPS' },
  { key: 'r16', label: 'R16' },
  { key: 'qf', label: 'QF' },
  { key: 'sf', label: 'SF' },
  { key: 'final', label: 'FINAL' },
  { key: 'all', label: 'FULL BRACKET' },
];

export function TournamentBracket({ traders }: { traders: RankedTrader[] }) {
  const [activePhase, setActivePhase] = useState<TournamentPhase>('groups');
  
  const bracket = useMemo(
    () => buildBracket(traders),
    [traders],
  );

  const champ = bracket.champion;

  return (
    <div className="flex flex-col gap-6">
      {/* Champion banner */}
      {champ && (
        <div
          className="cut-sm flex items-center justify-between px-5 py-4"
          style={{
            background: 'linear-gradient(90deg, rgba(255,215,0,0.04) 0%, rgba(8,12,18,0.4) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,215,0,0.14)',
          }}
        >
          {/* LEFT — Trophy icon */}
          <div className="relative h-16 w-12 flex-shrink-0">
            <Image
              src="/trencher-cup.png"
              alt="Trencher Cup"
              fill
              className="object-contain"
              style={{ filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.35))' }}
            />
          </div>

          {/* MIDDLE — Winner avatar + username + PnL */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: '2px solid rgba(255,215,0,0.5)' }}
            >
              <AvatarImage
                src={getPublicAvatarUrl(champ.username, champ.avatarUrl)}
                alt={champ.username}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[14px] font-bold text-white truncate">@{champ.username}</span>
            <span
              className="text-[16px] font-mono font-bold flex-shrink-0"
              style={{ color: '#7FE17B' }}
            >
              {champ.pnlUsd >= 0 ? '+' : ''}${Math.round(Math.abs(champ.pnlUsd) >= 1000 ? champ.pnlUsd / 1000 : Math.abs(champ.pnlUsd))}{Math.abs(champ.pnlUsd) >= 1000 ? 'K' : ''}
            </span>
          </div>

          {/* RIGHT — CTA */}
          <div className="hidden sm:flex flex-col items-center gap-1 text-center flex-shrink-0">
            <div className="text-[9px] font-mono tracking-[2px] text-[rgba(0,212,255,0.7)]">
              JOIN THE NEXT BRACKET
            </div>
            <ParticipateButton />
          </div>
        </div>
      )}

      {/* Phase Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {PHASES.map((phase) => (
            <button
              key={phase.key}
              onClick={() => setActivePhase(phase.key)}
              className="flex-shrink-0 px-4 py-2 font-mono text-[10px] tracking-[2px] transition-all"
              style={{
                background: activePhase === phase.key ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: activePhase === phase.key ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                color: activePhase === phase.key ? '#00D4FF' : 'rgba(255,255,255,0.4)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
            >
              {phase.label}
            </button>
          ))}
        </div>

        {/* Phase Content */}
        <div className="min-h-[300px]">
          {activePhase === 'groups' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {bracket.groups.map((group) => (
                <GroupCard key={group.name} group={group} />
              ))}
            </div>
          )}

          {activePhase === 'r16' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {bracket.knockoutRounds.r16.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          )}

          {activePhase === 'qf' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {bracket.knockoutRounds.qf.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          )}

          {activePhase === 'sf' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
              {bracket.knockoutRounds.sf.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          )}

          {activePhase === 'final' && (
            <div className="max-w-sm mx-auto">
              {bracket.knockoutRounds.final.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          )}

          {activePhase === 'all' && (
            <KnockoutBracket rounds={bracket.knockoutRounds} />
          )}
        </div>
      </div>

      <div className="flex sm:hidden mt-2">
        <ParticipateButton />
      </div>
    </div>
  );
}
