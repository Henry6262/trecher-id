'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
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

const BRACKET_H = 560;
const MIN_SCROLL_TRAVEL = 280;
const BRACKET_SCROLL_PORTION = 0.84;
const ROUND_SEPARATOR_WIDTH = 36;
const FINAL_TRAILING_WIDTH = 88;

function RoundColumn({ label, matchups, gap }: { label: string; matchups: Matchup[]; gap: string }) {
  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 220 }}>
      <div className="text-[10px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-4 text-center">{label}</div>
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

  const ROW_H = 96;
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

          <div className="relative z-10 flex h-full flex-col px-6 py-6 sm:px-8 sm:py-7 pointer-events-none">
            <div className="ml-auto flex w-full max-w-[760px] flex-col gap-5">
              {/* Title row — centered */}
              <div className="flex items-center justify-center gap-6">
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
                {/* Bigger trophy */}
                <div
                  className="relative h-[200px] w-[158px] shrink-0 sm:h-[260px] sm:w-[206px]"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.35)) drop-shadow(0 0 60px rgba(0,212,255,0.15))',
                    transform: `scale(${trophyScale}) rotate(${trophyRotate}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                >
                  <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
                </div>
              </div>

              {/* Champion + 2 metrics row */}
              <div className="flex items-center justify-center gap-6">
                {/* Small champion card */}
                {champ && (
                  <div
                    className="cut-sm flex items-center gap-2.5 px-3 py-2.5"
                    style={{
                      background: 'rgba(8,12,18,0.85)',
                      border: '1px solid rgba(255,215,0,0.15)',
                    }}
                  >
                    <div
                      className="h-8 w-8 overflow-hidden rounded-full flex-shrink-0"
                      style={{ border: '1.5px solid rgba(255,215,0,0.5)' }}
                    >
                      <AvatarImage
                        src={getPublicAvatarUrl(champ.username, champ.avatarUrl)}
                        alt={champ.username}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold text-white">@{champ.username}</div>
                      <div className="text-[11px] font-mono font-bold leading-none" style={{ color: '#7FE17B' }}>
                        {champ.pnlUsd >= 0 ? '+' : ''}${Math.abs(champ.pnlUsd) >= 1000 ? `${Math.round(champ.pnlUsd / 1000)}K` : Math.round(champ.pnlUsd)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2 metrics — no containers, inline */}
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <div className="text-[20px] font-black text-white leading-none">32</div>
                    <div className="mt-1 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">TRADERS</div>
                  </div>
                  <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="text-center">
                    <div className="text-[20px] font-black leading-none" style={{ color: '#59C8FF' }}>4</div>
                    <div className="mt-1 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">GROUPS</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-center text-[9px] font-mono tracking-[3px] text-[rgba(0,212,255,0.7)]">
                  JOIN THE NEXT BRACKET
                </div>
                <ParticipateButton className="pointer-events-auto" />
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
          <div className="flex-shrink-0" style={{ width: 1100 }}>
            <div className="text-[10px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-4 text-center">
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
