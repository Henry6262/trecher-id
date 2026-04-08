'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { AvatarImage } from '@/components/avatar-image';
import { ParticipateButton } from './participate-button';
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
const MIN_SCROLL_TRAVEL = 240;
const BRACKET_SCROLL_PORTION = 0.84;
const ROUND_SEPARATOR_WIDTH = 28;
const FINAL_TRAILING_WIDTH = 72;

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
  const stripRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(780);
  const [stripWidth, setStripWidth] = useState(0);
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
      setTargetProgress(progress);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      setScrollProgress((current) => {
        const next = current + (targetProgress - current) * 0.075;
        return Math.abs(next - targetProgress) < 0.001 ? targetProgress : next;
      });
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [targetProgress]);

  useEffect(() => {
    function measure() {
      if (!stickyRef.current) return;
      setVisibleWidth(stickyRef.current.clientWidth);
      setStripWidth(stripRef.current?.scrollWidth ?? 0);
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!bracket) {
    return (
      <div
        className="cut-sm flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
        style={{ background: 'rgba(8,12,18,0.72)', border: '1px solid rgba(0,212,255,0.08)' }}
      >
        <span className="text-[13px] text-[var(--trench-text)] font-mono">Not enough traders for bracket yet</span>
        <span className="text-[10px] text-[var(--trench-text-muted)]">Need 32 ranked traders. Currently at {traders.length}.</span>
      </div>
    );
  }

  const ROW_H = 72;
  const champ = bracket.champion;

  const overlayWidth = Math.min(visibleWidth * 0.56, 720);
  const bracketViewportWidth = Math.max(visibleWidth - overlayWidth + 64, visibleWidth * 0.5);
  const resolvedStripWidth = stripWidth || 1680;

  // Scroll the bracket against the viewport space that remains once the cup overlay owns the right side.
  const maxTranslate = Math.max(0, resolvedStripWidth - bracketViewportWidth);
  const scrollTravel = Math.max(MIN_SCROLL_TRAVEL, Math.round(maxTranslate * 0.72));
  const bracketProgress = Math.min(1, scrollProgress / BRACKET_SCROLL_PORTION);
  const translateX = -bracketProgress * maxTranslate;

  // Overlay reveals as bracket scrolls toward the end
  const overlayProgress = Math.min(1, Math.max(0, (scrollProgress - BRACKET_SCROLL_PORTION) / (1 - BRACKET_SCROLL_PORTION)));
  const overlaySlide = (1 - overlayProgress) * 100;
  const overlayOpacity = overlayProgress;
  const trophyScale = 0.7 + overlayProgress * 0.3;
  const trophyRotate = (1 - overlayProgress) * 8;

  return (
    <div>
      {/* Outer container — tall enough to give vertical scroll room for horizontal travel */}
      <div ref={outerRef} style={{ height: `calc(100vh + ${scrollTravel}px)` }}>
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
            width: 'min(64vw, 820px)',
            transform: `translateX(${overlaySlide}%)`,
            opacity: overlayOpacity,
            transition: 'opacity 0.05s linear, transform 0.05s linear',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(5,5,8,0) 0%, rgba(5,5,8,0.62) 6%, rgba(5,5,8,0.92) 14%, #050508 24%)' }}
          />

          <div className="relative z-10 flex h-full flex-col px-6 py-6 sm:px-8 sm:py-7">
            <div className="ml-auto flex w-full max-w-[760px] flex-col gap-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {champ ? (
                  <div
                    className="cut-sm relative w-full max-w-[250px] overflow-hidden px-4 py-4"
                    style={{
                      background: 'linear-gradient(180deg, rgba(8,12,18,0.92) 0%, rgba(8,12,18,0.75) 100%)',
                      border: '1px solid rgba(255,215,0,0.18)',
                      boxShadow: '0 0 24px rgba(255,215,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: 'linear-gradient(180deg, #FFD76A 0%, rgba(255,215,106,0.15) 100%)' }} />
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 overflow-hidden rounded-full"
                        style={{ border: '2px solid rgba(255,215,0,0.65)', boxShadow: '0 0 16px rgba(255,215,0,0.14)' }}
                      >
                        <AvatarImage
                          src={champ.avatarUrl || `https://unavatar.io/twitter/${champ.username}`}
                          alt={champ.username}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="rounded-full border border-[rgba(255,215,0,0.18)] bg-[rgba(255,215,0,0.08)] px-2 py-1 text-[8px] font-mono tracking-[2px] text-[#FFD700]">
                            CURRENT CHAMPION
                          </div>
                        </div>
                        <div className="truncate text-[18px] font-black text-white">@{champ.username}</div>
                        <div className="mt-1 text-[24px] font-mono font-black leading-none" style={{ color: '#7FE17B' }}>
                          {champ.pnlUsd >= 0 ? '+' : ''}${Math.abs(champ.pnlUsd) >= 1000 ? `${Math.round(champ.pnlUsd / 1000)}K` : Math.round(champ.pnlUsd)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[26px] font-black font-mono leading-none" style={{ color: '#7FE17B' }}>
                          69%
                        </div>
                        <div className="mt-1 text-[8px] font-mono tracking-[2px] text-[rgba(255,255,255,0.45)]">
                          OF FEES
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex flex-1 items-center justify-end gap-4 lg:min-w-0 lg:pl-4">
                  <div className="text-right">
                    <div className="text-[11px] font-mono tracking-[6px] text-[var(--trench-text-muted)]">SEASON 1</div>
                    <div className="mt-2 text-[52px] font-black leading-[0.82] tracking-[-0.07em] text-white sm:text-[68px]">
                      Trencher
                    </div>
                    <div
                      className="text-[52px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[68px]"
                      style={{ color: '#59C8FF', textShadow: '0 0 34px rgba(0,212,255,0.28), 0 0 68px rgba(0,212,255,0.1)' }}
                    >
                      Cup
                    </div>
                  </div>
                  <div
                    className="relative h-[150px] w-[118px] shrink-0 sm:h-[188px] sm:w-[148px]"
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

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div
                  className="cut-sm grid gap-3 px-4 py-4 sm:grid-cols-3"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.015)',
                  }}
                >
                  {[
                    { value: '32', label: 'TRADERS', note: 'QUALIFY BY 7D PNL', tone: '#ffffff' },
                    { value: '4', label: 'GROUPS', note: 'TOP 2 ADVANCE', tone: '#59C8FF' },
                    { value: '69%', label: 'CHAMPION', note: 'OF ALL FEES', tone: '#7FE17B' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="cut-xs px-4 py-4"
                      style={{
                        background: 'linear-gradient(180deg, rgba(7,10,16,0.92) 0%, rgba(7,10,16,0.72) 100%)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                      }}
                    >
                      <div className="text-[10px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">
                        {item.label}
                      </div>
                      <div
                        className="mt-2 text-[36px] font-black leading-none tracking-[-0.05em]"
                        style={{ color: item.tone, textShadow: item.tone === '#ffffff' ? '0 0 18px rgba(255,255,255,0.08)' : `0 0 24px ${item.tone}22` }}
                      >
                        {item.value}
                      </div>
                      <div className="mt-3 text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.58)]">
                        {item.note}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <div className="text-center text-[10px] font-mono tracking-[3px] text-[rgba(0,212,255,0.7)]">
                    JOIN THE NEXT BRACKET
                  </div>
                  <ParticipateButton className="pointer-events-auto w-full justify-center" />
                  <div className="text-center text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.42)]">
                    SIGN IN. LINK WALLETS. CLIMB INTO THE CUP.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Bracket strip — translates horizontally based on vertical scroll */}
          <div
            ref={stripRef}
            className="flex items-stretch gap-0 will-change-transform"
            style={{
              width: 'max-content',
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

          <div className="flex-shrink-0 flex items-center" style={{ width: ROUND_SEPARATOR_WIDTH }}>
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

          <div className="flex-shrink-0" style={{ width: FINAL_TRAILING_WIDTH }} />
          </div>
        </div>
      </div>
    </div>
  );
}
