'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AvatarImage } from '@/components/avatar-image';
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
  const bracket = useMemo(
    () => (traders.length >= 32 ? buildBracket(traders) : null),
    [traders],
  );

  useEffect(() => {
    function onScroll() {
      const outer = outerRef.current;
      if (!outer) return;
      const rect = outer.getBoundingClientRect();
      // Sticky pins when rect.top <= 0. Horizontal scroll range = total height minus one viewport.
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

  if (!bracket) {
    return (
      <div
        className="cut-sm flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
        style={{ background: 'rgba(8,12,18,0.72)', border: '1px solid rgba(0,212,255,0.08)' }}
      >
        <span className="text-[13px] text-[var(--trench-text)] font-mono">Not enough traders for bracket yet</span>
        <span className="text-[10px] text-[var(--trench-text-muted)]">Need 32 ranked traders. Currently at {traders.length}.</span>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[9px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
          <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>TOP 32 QUALIFY</span>
          <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>TOP 2 PER GROUP ADVANCE</span>
          <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>CHAMPION TAKES 69%</span>
        </div>
      </div>
    );
  }

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
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-[9px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
        <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>TOP 32 BY 7D PNL</span>
        <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>TOP 2 FROM EACH GROUP ADVANCE</span>
        <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>CHAMPION TAKES 69% OF FEES</span>
      </div>

      {/* Outer container — tall enough to give vertical scroll room for horizontal travel */}
      {/* SCROLL_WIDTH of extra height converts to horizontal travel, plus bracket height */}
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
            width: 'min(62vw, 760px)',
            transform: `translateX(${overlaySlide}%)`,
            opacity: overlayOpacity,
            transition: 'opacity 0.05s linear, transform 0.05s linear',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(5,5,8,0.45) 12%, rgba(5,5,8,0.88) 28%, #050508 52%)' }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between px-6 py-7 sm:px-8">
            <div className="ml-auto w-full max-w-[620px]">
              <div className="mb-3 text-center text-[11px] font-mono tracking-[6px] text-[var(--trench-text-muted)] sm:text-right">
                SEASON 1
              </div>

              <div className="flex items-end justify-end gap-3 sm:gap-5">
                <div className="min-w-0 flex-1 text-right">
                  <h3
                    className="text-[54px] sm:text-[68px] lg:text-[76px] font-black text-white leading-[0.82] tracking-[-0.05em]"
                    style={{ textWrap: 'balance' }}
                  >
                    The Trencher
                  </h3>
                  <h3
                    className="text-[58px] sm:text-[76px] lg:text-[86px] font-black leading-[0.8] tracking-[-0.06em]"
                    style={{ color: '#59C8FF', textShadow: '0 0 34px rgba(0,212,255,0.28), 0 0 68px rgba(0,212,255,0.1)' }}
                  >
                    Cup
                  </h3>
                </div>

                <div
                  className="relative h-[160px] w-[125px] sm:h-[215px] sm:w-[170px] lg:h-[255px] lg:w-[205px] flex-shrink-0"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.35)) drop-shadow(0 0 60px rgba(0,212,255,0.15))',
                    transform: `scale(${trophyScale}) rotate(${trophyRotate}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                >
                  <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 ml-auto max-w-[430px] w-full">
              {/* Champion card */}
              {champ ? (
                <div
                  className="w-full px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(8,12,18,0.92) 0%, rgba(7,10,18,0.74) 100%)',
                    border: '1px solid rgba(255,215,0,0.22)',
                    boxShadow: '0 0 24px rgba(255,215,0,0.08)',
                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                  }}
                >
                  <div className="mb-2 text-[8px] font-mono tracking-[3px]" style={{ color: '#FFD700' }}>
                    TOURNAMENT CHAMPION
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2.5px solid rgba(255,215,0,0.65)', boxShadow: '0 0 18px rgba(255,215,0,0.16)' }}>
                      <AvatarImage
                        src={champ.avatarUrl || `https://unavatar.io/twitter/${champ.username}`}
                        alt={champ.username}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-black text-white">@{champ.username}</div>
                      <div className="text-[20px] font-mono font-black" style={{ color: '#62D26F', textShadow: '0 0 14px rgba(34,197,94,0.22)' }}>
                        {champ.pnlUsd >= 0 ? '+' : ''}${Math.abs(champ.pnlUsd) >= 1000 ? `${Math.round(champ.pnlUsd / 1000)}K` : Math.round(champ.pnlUsd)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[28px] font-black font-mono leading-none" style={{ color: '#62D26F', textShadow: '0 0 18px rgba(34,197,94,0.26)' }}>
                        69%
                      </div>
                      <div className="mt-1 text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
                        OF ALL FEES
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* CTA */}
              <div className="w-full">
                <Link
                  href="/leaderboard"
                  className="pointer-events-auto w-full inline-flex items-center justify-center px-9 py-4 text-[12px] font-bold tracking-[3px] text-black"
                  style={{
                    background: '#59C8FF',
                    boxShadow: '0 0 24px rgba(0,212,255,0.24)',
                    clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                  }}
                >
                  ENTER THE ARENA →
                </Link>
              </div>
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
    </div>
  );
}
