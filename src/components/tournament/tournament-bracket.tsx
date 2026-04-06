'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { buildBracket } from './bracket-utils';
import { GroupCard } from './group-card';
import { MatchupCard } from './matchup-card';
import { BracketConnector } from './bracket-connector';
import type { RankedTrader, Matchup } from './bracket-utils';

const ROUND_LABELS: Record<string, string> = {
  groups: 'GROUP STAGE',
  sf: 'SEMI-FINALS',
  final: 'FINAL',
};

const BRACKET_H = 420;
// Total horizontal distance the bracket needs to scroll
const SCROLL_WIDTH = 2200;

function RoundColumn({ label, matchups, gap }: { label: string; matchups: Matchup[]; gap: string }) {
  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 180 }}>
      <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-3 text-center">{label}</div>
      <div className="flex flex-col justify-around flex-1" style={{ gap }}>
        {matchups.map((m) => (
          <MatchupCard key={m.id} matchup={m} compact={matchups.length > 4} />
        ))}
      </div>
    </div>
  );
}

export function TournamentBracket({ traders }: { traders: RankedTrader[] }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const outer = outerRef.current;
      if (!outer) return;
      const rect = outer.getBoundingClientRect();
      // Sticky pins when rect.top <= 0. Horizontal scroll range = total height minus one viewport.
      // Sticky offset from top of viewport
      const stickyTop = (window.innerHeight - BRACKET_H) / 2;
      // Total distance the outer container scrolls while sticky is pinned
      const stickyTravel = outer.offsetHeight - window.innerHeight;
      if (stickyTravel <= 0) return;
      // Progress starts when section top goes above viewport (rect.top goes negative)
      const progress = Math.min(1, Math.max(0, -rect.top / stickyTravel));
      setScrollProgress(progress);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (traders.length < 32) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <span className="text-[13px] text-[var(--trench-text-muted)] font-mono">Not enough traders for bracket (need 32)</span>
        <span className="text-[10px] text-[var(--trench-text-muted)]">Currently {traders.length} traders ranked</span>
      </div>
    );
  }

  const bracket = useMemo(() => buildBracket(traders), [traders]);
  const ROW_H = 72;
  const champ = bracket.champion;

  // How far the bracket strip has translated (px)
  const maxTranslate = SCROLL_WIDTH - 780; // 780 ≈ max visible container width
  const translateX = -scrollProgress * maxTranslate;

  // Overlay reveals as bracket scrolls toward the end
  const overlayProgress = Math.min(1, Math.max(0, (scrollProgress - 0.5) / 0.5)); // kicks in at 50%
  const overlaySlide = (1 - overlayProgress) * 100;
  const overlayOpacity = overlayProgress;
  const trophyScale = 0.7 + overlayProgress * 0.3;
  const trophyRotate = (1 - overlayProgress) * 8;

  return (
    // Outer container — tall enough to give vertical scroll room for horizontal travel
    // SCROLL_WIDTH of extra height converts to horizontal travel, plus bracket height
    <div ref={outerRef} style={{ height: SCROLL_WIDTH }}>
      {/* Sticky wrapper — pins the bracket to viewport while scrolling */}
      <div
        ref={stickyRef}
        className="sticky overflow-hidden"
        style={{ height: BRACKET_H, top: `calc(50vh - ${BRACKET_H / 2}px)` }}
      >
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(5,5,8,1) 0%, transparent 100%)' }} />
        <div className="absolute left-0 top-0 right-0 h-10 z-10 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,1) 0%, transparent 100%)' }} />
        <div className="absolute left-0 bottom-0 right-0 h-10 z-10 pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(5,5,8,1) 0%, transparent 100%)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, rgba(5,5,8,1) 0%, transparent 100%)' }} />

        {/* Trophy overlay — slides in from right */}
        <div
          className="absolute top-0 right-0 bottom-0 z-20 pointer-events-none"
          style={{
            width: '50%',
            transform: `translateX(${overlaySlide}%)`,
            opacity: overlayOpacity,
            transition: 'opacity 0.05s linear, transform 0.05s linear',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(5,5,8,0.8) 20%, #050508 40%)' }}
          />

          <div className="relative z-10 h-full flex flex-col items-center justify-center pointer-events-none pr-4 pl-8 ml-auto" style={{ marginRight: -30 }}>
            <div className="text-center mb-2">
              <div className="text-[10px] font-mono tracking-[4px] text-[var(--trench-text-muted)] mb-1">SEASON 1</div>
              <h3 className="text-[22px] sm:text-[28px] font-black text-white leading-[0.9]">The Trencher</h3>
              <h3 className="text-[26px] sm:text-[34px] font-black leading-[0.9]" style={{ color: '#00D4FF', textShadow: '0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)' }}>Cup</h3>
            </div>

            <div
              className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] my-2"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.35)) drop-shadow(0 0 60px rgba(0,212,255,0.15))',
                transform: `scale(${trophyScale}) rotate(${trophyRotate}deg)`,
              }}
            >
              <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
            </div>

            {champ && (
              <div className="flex items-center gap-3 mt-1 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2.5px solid rgba(255,215,0,0.6)', boxShadow: '0 0 16px rgba(255,215,0,0.2)' }}>
                  <Image src={champ.avatarUrl || `https://unavatar.io/twitter/${champ.username}`} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-black text-white">@{champ.username}</span>
                    <span className="text-[8px] font-mono tracking-[2px] px-1.5 py-0.5 cut-xs" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)' }}>CHAMPION</span>
                  </div>
                  <div className="text-[16px] font-mono font-black" style={{ color: '#22c55e', textShadow: '0 0 12px rgba(34,197,94,0.25)' }}>
                    {champ.pnlUsd >= 0 ? '+' : ''}${Math.abs(champ.pnlUsd) >= 1000 ? `${Math.round(champ.pnlUsd / 1000)}K` : Math.round(champ.pnlUsd)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-[24px] font-black font-mono" style={{ color: '#22c55e', textShadow: '0 0 16px rgba(34,197,94,0.3)' }}>69%</div>
                <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">OF ALL FEES</div>
              </div>
              <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <a
                href="/leaderboard"
                className="pointer-events-auto inline-block px-5 py-2.5 text-[9px] font-bold tracking-[2px] text-black cut-xs"
                style={{ background: '#00D4FF', textDecoration: 'none', boxShadow: '0 0 20px rgba(0,212,255,0.3)', position: 'relative', zIndex: 50 }}
              >
                ENTER THE ARENA →
              </a>
            </div>
          </div>
        </div>

        {/* Bracket strip — translates horizontally based on vertical scroll */}
        <div
          className="flex items-stretch gap-0 will-change-transform"
          style={{
            minWidth: SCROLL_WIDTH,
            minHeight: BRACKET_H,
            transform: `translateX(${translateX}px)`,
          }}
        >
          {/* Groups: 4-col grid = 2 rows */}
          <div className="flex-shrink-0" style={{ width: 920 }}>
            <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-3 text-center">
              {ROUND_LABELS.groups}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {bracket.groups.map((group) => (
                <GroupCard key={group.name} group={group} />
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center mx-3">
            <div className="w-px h-3/4" style={{ background: 'rgba(0,212,255,0.1)' }} />
          </div>

          <RoundColumn label="QUARTER-FINALS" matchups={bracket.knockoutRounds.qf} gap="12px" />
          <div className="flex items-center flex-shrink-0">
            <BracketConnector matchups={4} rowHeight={ROW_H} gap={12} delay={0} />
          </div>

          <RoundColumn label={ROUND_LABELS.sf} matchups={bracket.knockoutRounds.sf} gap="48px" />
          <div className="flex items-center flex-shrink-0">
            <BracketConnector matchups={2} rowHeight={ROW_H} gap={48} delay={0.3} />
          </div>

          <RoundColumn label={ROUND_LABELS.final} matchups={bracket.knockoutRounds.final} gap="0px" />

          <div className="flex-shrink-0" style={{ width: 260 }} />
        </div>
      </div>
    </div>
  );
}
