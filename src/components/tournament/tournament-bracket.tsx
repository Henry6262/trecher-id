'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
import { ParticipateButton } from './participate-button';
import { buildBracket } from './bracket-utils';
import { GroupCard } from './group-card';
import type { RankedTrader } from './bracket-utils';

export function TournamentBracket({ traders }: { traders: RankedTrader[] }) {
  const bracket = useMemo(
    () => (traders.length >= 32 ? buildBracket(traders) : null),
    [traders],
  );

  if (!bracket) {
    return (
      <div
        className="cut-sm flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
        style={{ background: 'rgba(8,12,18,0.72)', border: '1px solid rgba(0,212,255,0.08)' }}
      >
        <span className="text-[13px] text-[var(--trench-text)] font-mono">
          Not enough traders for bracket yet
        </span>
        <span className="text-[10px] text-[var(--trench-text-muted)]">
          Need 32 ranked traders. Currently at {traders.length}.
        </span>
      </div>
    );
  }

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

      {/* Group stage */}
      <div>
        <div className="mb-3 text-[9px] font-mono tracking-[3px] text-[var(--trench-text-muted)]">
          8 GROUPS · TOP 2 ADVANCE
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {bracket.groups.map((group) => (
            <GroupCard key={group.name} group={group} />
          ))}
        </div>
      </div>

      <div className="flex sm:hidden mt-2">
        <ParticipateButton />
      </div>
    </div>
  );
}
