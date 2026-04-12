'use client';

import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
import { buildBracket, type BracketData, type Group, type Matchup, type RankedTrader } from './bracket-utils';
import { ChevronRight, Trophy } from 'lucide-react';
import Link from 'next/link';

// ──────────────────────────────────────────────────────────────
// ROUND HEADER
// ──────────────────────────────────────────────────────────────

function RoundHeader({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-accent)] uppercase">{label}</div>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.2), transparent)' }} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// GROUP CARD (compact)
// ──────────────────────────────────────────────────────────────

function CompactGroupCard({ group }: { group: Group }) {
  return (
    <div
      className="cut-sm overflow-hidden"
      style={{ background: 'rgba(8,12,18,0.7)', border: '1px solid rgba(0,212,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(0,212,255,0.04)', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
        <span className="text-[9px] font-mono tracking-[2px] text-[#00D4FF]">GROUP {group.name}</span>
        <span className="text-[7px] font-mono tracking-[1px] text-[var(--trench-text-muted)]">TOP 2 →</span>
      </div>

      {/* Trader rows */}
      {group.traders.map((trader, i) => {
        const qualified = i < 2;
        return (
          <Link
            key={trader.username}
            href={`/${trader.username}`}
            className="flex items-center gap-2 px-3 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
            style={{
              height: 38,
              opacity: qualified ? 1 : 0.45,
              borderLeft: qualified ? '2px solid #00D4FF' : '2px solid transparent',
              background: qualified ? 'rgba(0,212,255,0.03)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            {/* Position */}
            <span className="text-[9px] font-mono font-bold text-[var(--trench-text-muted)] w-4 text-center flex-shrink-0">
              {i + 1}
            </span>

            {/* Avatar */}
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(0,212,255,0.12)' }}>
              <AvatarImage
                src={getPublicAvatarUrl(trader.username, trader.avatarUrl)}
                alt={trader.displayName}
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Username */}
            <span className="min-w-0 flex-1 text-[10px] font-semibold text-white truncate">
              {trader.displayName}
            </span>

            {/* PnL */}
            <span
              className="text-[9px] font-mono font-bold flex-shrink-0"
              style={{ color: trader.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)' }}
            >
              {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000 ? `${Math.round(trader.pnlUsd / 1000)}K` : Math.round(trader.pnlUsd)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MATCHUP CARD (knockout)
// ──────────────────────────────────────────────────────────────

function MatchupCard({ matchup }: { matchup: Matchup }) {
  const renderTrader = (trader: RankedTrader | null, side: 'top' | 'bottom') => {
    if (!trader) {
      return (
        <div className="flex items-center gap-2 px-3 py-2" style={{ opacity: 0.25 }}>
          <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <span className="text-[9px] font-mono text-[var(--trench-text-muted)]">TBD</span>
        </div>
      );
    }

    const isWinner = matchup.winner?.username === trader.username;

    return (
      <Link
        href={`/${trader.username}`}
        className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
        style={{
          opacity: isWinner ? 1 : 0.4,
          background: isWinner ? 'linear-gradient(90deg, rgba(0,212,255,0.08), transparent)' : 'transparent',
          borderLeft: isWinner ? '2px solid #00D4FF' : '2px solid transparent',
          borderBottom: side === 'top' ? '1px solid rgba(255,255,255,0.03)' : 'none',
          textDecoration: 'none',
        }}
      >
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ border: isWinner ? '1.5px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
          <AvatarImage
            src={getPublicAvatarUrl(trader.username, trader.avatarUrl)}
            alt={trader.displayName}
            width={24}
            height={24}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="min-w-0 flex-1 text-[10px] font-semibold text-white truncate">
          {isWinner && <span className="mr-1">👑</span>}@{trader.username}
        </span>
        <span
          className="text-[9px] font-mono font-bold flex-shrink-0"
          style={{ color: trader.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)', textDecoration: isWinner ? 'none' : 'line-through' }}
        >
          {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000 ? `${Math.round(trader.pnlUsd / 1000)}K` : Math.round(trader.pnlUsd)}
        </span>
      </Link>
    );
  };

  return (
    <div
      className="cut-sm overflow-hidden"
      style={{ background: 'rgba(8,12,18,0.8)', border: '1px solid rgba(0,212,255,0.08)' }}
    >
      {renderTrader(matchup.trader1, 'top')}
      {renderTrader(matchup.trader2, 'bottom')}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN TOURNAMENT BRACKET (VERTICAL LAYOUT)
// ──────────────────────────────────────────────────────────────

export function TournamentBracket({ traders }: { traders: RankedTrader[] }) {
  const bracket: BracketData | null = traders.length >= 32 ? buildBracket(traders) : null;

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

  return (
    <div className="space-y-10">
      {/* ── GROUP STAGE ── */}
      <div>
        <RoundHeader label="Group Stage" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bracket.groups.map((group) => (
            <CompactGroupCard key={group.name} group={group} />
          ))}
        </div>
      </div>

      {/* ── KNOCKOUT BRACKET ── */}
      <div>
        <RoundHeader label="Knockout" icon={<Trophy size={14} style={{ color: '#FFD700' }} />} />
        <div className="space-y-6">
          {/* R16 */}
          <div>
            <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">ROUND OF 16</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bracket.knockoutRounds.r16.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          </div>

          {/* Connector arrows */}
          <div className="flex justify-center">
            <ChevronRight size={16} className="text-[var(--trench-accent)] opacity-30 -rotate-90" />
          </div>

          {/* QF */}
          <div>
            <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">QUARTER-FINALS</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bracket.knockoutRounds.qf.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          </div>

          {/* Connector arrows */}
          <div className="flex justify-center">
            <ChevronRight size={16} className="text-[var(--trench-accent)] opacity-30 -rotate-90" />
          </div>

          {/* SF */}
          <div>
            <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">SEMI-FINALS</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:col-span-2 sm:col-start-2">
              {bracket.knockoutRounds.sf.map((m) => (
                <MatchupCard key={m.id} matchup={m} />
              ))}
            </div>
          </div>

          {/* Connector arrows */}
          <div className="flex justify-center">
            <ChevronRight size={16} className="text-[var(--trench-accent)] opacity-30 -rotate-90" />
          </div>

          {/* FINAL */}
          <div className="flex justify-center">
            <div className="w-full max-w-xs">
              <div className="text-[8px] font-mono tracking-[2px] text-[#FFD700] mb-2 text-center">🏆 FINAL</div>
              <MatchupCard matchup={bracket.knockoutRounds.final[0]} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CHAMPION ── */}
      {bracket.champion && (
        <div className="flex justify-center">
          <div
            className="cut-sm flex items-center gap-3 px-5 py-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(8,12,18,0.9))',
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <Trophy size={20} style={{ color: '#FFD700' }} />
            <div>
              <div className="text-[8px] font-mono tracking-[2px] text-[#FFD700]">CHAMPION</div>
              <Link href={`/${bracket.champion!.username}`} className="text-[14px] font-bold text-white hover:text-[var(--trench-accent)] transition-colors">
                {bracket.champion.displayName}
              </Link>
              <div className="text-[11px] font-mono font-bold" style={{ color: '#7FE17B' }}>
                {bracket.champion.pnlUsd >= 0 ? '+' : ''}${Math.round(bracket.champion.pnlUsd)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
