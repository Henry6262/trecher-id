'use client';

import { useState } from 'react';
import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
import { ChevronRight, Trophy, Crown, ArrowRight, Users, Grid3X3, LayoutGrid, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { buildBracket, type RankedTrader, type Group, type Matchup } from '@/components/tournament/bracket-utils';

// ──────────────────────────────────────────────────────────────
// MOCK DATA
// ──────────────────────────────────────────────────────────────

function makeTrader(username: string, pnlUsd: number, trades: number, winRate: number, displayName?: string): RankedTrader {
  return {
    rank: 0,
    username,
    displayName: displayName || username,
    avatarUrl: null,
    pnlUsd,
    pnlSol: pnlUsd / 150,
    trades,
    winRate,
  };
}

const TRADERS: RankedTrader[] = [
  makeTrader('jackduval', 27000, 98, 32, 'Jack Duval'),
  makeTrader('deployer_02', 110000, 712, 27, 'Deployer #2'),
  makeTrader('BulgarianDegen', 6500, 290, 97, 'BulgarianDegen'),
  makeTrader('deployer_16', 15800, 84, 75, 'Deployer #16'),
  makeTrader('deployer_10', 14500, 864, 4, 'Deployer #10'),
  makeTrader('im0pnl', 1800, 147, 45, 'zeropnl'),
  makeTrader('deployer_19', 2000, 404, 15, 'Deployer #19'),
  makeTrader('deployer_15', 1700, 671, 39, 'Deployer #15'),
  makeTrader('deployer_20', 416, 743, 47, 'Deployer #20'),
  makeTrader('deployer_03', 100, 523, 49, 'Deployer #3'),
  makeTrader('deployer_04', 0, 0, 0, 'Deployer #4'),
  makeTrader('deployer_07', -3, 397, 39, 'Deployer #7'),
  makeTrader('deployer_08', -1023, 575, 40, 'Deployer #8'),
  makeTrader('jackduval2', -1094, 944, 13, 'Jack Duval 2'),
  makeTrader('deployer_05', -2616, 1029, 16, 'Deployer #5'),
  makeTrader('deployer_18', -2710, 440, 37, 'Deployer #18'),
  makeTrader('deployer_09', -566, 333, 0, 'Deployer #9'),
  makeTrader('deployer_11', -53, 798, 4, 'Deployer #11'),
  makeTrader('deployer_12', -15, 730, 5, 'Deployer #12'),
  makeTrader('deployer_13', -38, 681, 9, 'Deployer #13'),
  makeTrader('deployer_14', -15, 634, 5, 'Deployer #14'),
  makeTrader('deployer_17', -127, 590, 21, 'Deployer #17'),
  makeTrader('deployer_21', -23, 470, 5, 'Deployer #21'),
  makeTrader('deployer_22', -13, 411, 23, 'Deployer #22'),
  makeTrader('deployer_23', -15, 475, 19, 'Deployer #23'),
  makeTrader('deployer_24', -4, 523, 30, 'Deployer #24'),
  makeTrader('deployer_25', -13, 440, 37, 'Deployer #25'),
  makeTrader('deployer_26', -1, 864, 4, 'Deployer #26'),
  makeTrader('deployer_27', -7, 743, 47, 'Deployer #27'),
  makeTrader('deployer_28', -110, 712, 27, 'Deployer #28'),
  makeTrader('deployer_29', -92, 575, 40, 'Deployer #29'),
  makeTrader('deployer_30', -10, 944, 13, 'Deployer #30'),
].map((t, i) => ({ ...t, rank: i + 1 }));

const BRACKET = buildBracket(TRADERS);

// ──────────────────────────────────────────────────────────────
// OPTION 1: TABBED BRACKET
// ──────────────────────────────────────────────────────────────

function Option1Tabbed() {
  const [tab, setTab] = useState<'groups' | 'r16' | 'qf' | 'sf' | 'final'>('groups');

  const tabs = [
    { key: 'groups' as const, label: 'GROUPS', icon: Grid3X3 },
    { key: 'r16' as const, label: 'R16', icon: Users },
    { key: 'qf' as const, label: 'QF', icon: Users },
    { key: 'sf' as const, label: 'SF', icon: Users },
    { key: 'final' as const, label: 'FINAL', icon: Trophy },
  ];

  const renderGroups = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {BRACKET.groups.map((group) => (
        <GroupCard key={group.name} group={group} />
      ))}
    </div>
  );

  const renderRound = (matches: Matchup[], label: string) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {matches.map((m) => (
        <MatchCard key={m.id} matchup={m} />
      ))}
    </div>
  );

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono tracking-[2px] transition-all whitespace-nowrap"
            style={{
              background: tab === key ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.02)',
              border: tab === key ? '1px solid rgba(0,212,255,0.25)' : '1px solid rgba(255,255,255,0.06)',
              color: tab === key ? '#00D4FF' : 'var(--trench-text-muted)',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tab === 'groups' && renderGroups()}
        {tab === 'r16' && renderRound(BRACKET.knockoutRounds.r16, 'Round of 16')}
        {tab === 'qf' && renderRound(BRACKET.knockoutRounds.qf, 'Quarter-Finals')}
        {tab === 'sf' && renderRound(BRACKET.knockoutRounds.sf, 'Semi-Finals')}
        {tab === 'final' && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <MatchCard matchup={BRACKET.knockoutRounds.final[0]} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// OPTION 2: HORIZONTAL SCROLL (WIDER CARDS)
// ──────────────────────────────────────────────────────────────

function Option2HorizontalScroll() {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch gap-0" style={{ width: 'max-content' }}>
        {/* Groups Column */}
        <div className="flex-shrink-0 pr-6" style={{ width: 560 }}>
          <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-accent)] mb-3">GROUP STAGE</div>
          <div className="grid grid-cols-2 gap-2">
            {BRACKET.groups.map((g) => (
              <GroupCard key={g.name} group={g} compact />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="flex-shrink-0 flex items-center px-3">
          <div className="w-px h-3/4" style={{ background: 'rgba(0,212,255,0.1)' }} />
        </div>

        {/* R16 Column */}
        <div className="flex-shrink-0 pr-6" style={{ width: 280 }}>
          <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-text-muted)] mb-3">ROUND OF 16</div>
          <div className="flex flex-col gap-2">
            {BRACKET.knockoutRounds.r16.map((m) => (
              <MatchCard key={m.id} matchup={m} />
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex-shrink-0 flex items-center px-2">
          <ArrowRight size={14} className="text-[var(--trench-accent)] opacity-30" />
        </div>

        {/* QF Column */}
        <div className="flex-shrink-0 pr-6" style={{ width: 280 }}>
          <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-text-muted)] mb-3">QUARTER-FINALS</div>
          <div className="flex flex-col gap-2">
            {BRACKET.knockoutRounds.qf.map((m) => (
              <MatchCard key={m.id} matchup={m} />
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex-shrink-0 flex items-center px-2">
          <ArrowRight size={14} className="text-[var(--trench-accent)] opacity-30" />
        </div>

        {/* SF Column */}
        <div className="flex-shrink-0 pr-6" style={{ width: 280 }}>
          <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-text-muted)] mb-3">SEMI-FINALS</div>
          <div className="flex flex-col gap-3">
            {BRACKET.knockoutRounds.sf.map((m) => (
              <MatchCard key={m.id} matchup={m} />
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex-shrink-0 flex items-center px-2">
          <ArrowRight size={14} className="text-[var(--trench-accent)] opacity-30" />
        </div>

        {/* Final Column */}
        <div className="flex-shrink-0 pr-4" style={{ width: 280 }}>
          <div className="text-[10px] font-mono tracking-[3px] text-[#FFD700] mb-3">🏆 FINAL</div>
          <MatchCard matchup={BRACKET.knockoutRounds.final[0]} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// OPTION 3: HYBRID (GROUPS SUMMARY + SCROLLING KNOCKOUT)
// ──────────────────────────────────────────────────────────────

function Option3Hybrid() {
  return (
    <div className="space-y-6">
      {/* Groups Summary — OUTSIDE scroll */}
      <div>
        <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-accent)] mb-3">GROUP QUALIFIERS (TOP 2 ADVANCE →)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {BRACKET.groups.map((g) => (
            <GroupSummaryCard key={g.name} group={g} />
          ))}
        </div>
      </div>

      {/* Knockout — Horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-stretch gap-0" style={{ width: 'max-content' }}>
          {/* R16 */}
          <div className="flex-shrink-0 pr-6" style={{ width: 280 }}>
            <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-accent)] mb-3">ROUND OF 16</div>
            <div className="flex flex-col gap-2">
              {BRACKET.knockoutRounds.r16.map((m) => (
                <MatchCard key={m.id} matchup={m} />
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex-shrink-0 flex items-center px-2">
            <ArrowRight size={14} className="text-[var(--trench-accent)] opacity-30" />
          </div>

          {/* QF */}
          <div className="flex-shrink-0 pr-6" style={{ width: 280 }}>
            <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-accent)] mb-3">QUARTER-FINALS</div>
            <div className="flex flex-col gap-2">
              {BRACKET.knockoutRounds.qf.map((m) => (
                <MatchCard key={m.id} matchup={m} />
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex-shrink-0 flex items-center px-2">
            <ArrowRight size={14} className="text-[var(--trench-accent)] opacity-30" />
          </div>

          {/* SF */}
          <div className="flex-shrink-0 pr-6" style={{ width: 280 }}>
            <div className="text-[10px] font-mono tracking-[3px] text-[var(--trench-accent)] mb-3">SEMI-FINALS</div>
            <div className="flex flex-col gap-3">
              {BRACKET.knockoutRounds.sf.map((m) => (
                <MatchCard key={m.id} matchup={m} />
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex-shrink-0 flex items-center px-2">
            <ArrowRight size={14} className="text-[var(--trench-accent)] opacity-30" />
          </div>

          {/* Final */}
          <div className="flex-shrink-0 pr-4" style={{ width: 280 }}>
            <div className="text-[10px] font-mono tracking-[3px] text-[#FFD700] mb-3">🏆 FINAL</div>
            <MatchCard matchup={BRACKET.knockoutRounds.final[0]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// REUSABLE CARDS
// ──────────────────────────────────────────────────────────────

function GroupCard({ group, compact }: { group: Group; compact?: boolean }) {
  return (
    <div
      className="cut-sm overflow-hidden"
      style={{ background: 'rgba(8,12,18,0.8)', border: '1px solid rgba(0,212,255,0.1)' }}
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(0,212,255,0.04)', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
        <span className="text-[9px] font-mono tracking-[2px] text-[#00D4FF]">GROUP {group.name}</span>
        <span className="text-[7px] font-mono tracking-[1px] text-[var(--trench-text-muted)]">TOP 2 →</span>
      </div>
      {group.traders.map((trader, i) => {
        const qualified = i < 2;
        return (
          <Link
            key={trader.username}
            href={`/${trader.username}`}
            className="flex items-center gap-2 px-3 transition-colors hover:bg-[rgba(0,212,255,0.06)] group"
            style={{
              height: compact ? 36 : 40,
              opacity: qualified ? 1 : 0.4,
              borderLeft: qualified ? '2px solid #00D4FF' : '2px solid transparent',
              background: qualified ? 'rgba(0,212,255,0.03)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            <span className="text-[9px] font-mono font-bold text-[var(--trench-text-muted)] w-4 text-center flex-shrink-0">{i + 1}</span>
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[rgba(0,212,255,0.15)] group-hover:ring-[rgba(0,212,255,0.3)] transition-all">
              <AvatarImage src={getPublicAvatarUrl(trader.username, trader.avatarUrl)} alt={trader.displayName} width={24} height={24} className="w-full h-full object-cover" />
            </div>
            <span className="min-w-0 flex-1 text-[10px] font-semibold text-white truncate group-hover:text-[var(--trench-accent)] transition-colors">{trader.displayName}</span>
            <span className="text-[9px] font-mono font-bold flex-shrink-0" style={{ color: trader.pnlUsd >= 0 ? '#22c55e' : '#ef4444' }}>
              {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000 ? `${Math.round(trader.pnlUsd / 1000)}K` : Math.round(trader.pnlUsd)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function GroupSummaryCard({ group }: { group: Group }) {
  return (
    <div
      className="cut-sm px-3 py-2"
      style={{ background: 'rgba(8,12,18,0.7)', border: '1px solid rgba(0,212,255,0.06)' }}
    >
      <div className="text-[8px] font-mono tracking-[2px] text-[#00D4FF] mb-2">GROUP {group.name}</div>
      {group.traders.slice(0, 2).map((trader, i) => (
        <Link
          key={trader.username}
          href={`/${trader.username}`}
          className="flex items-center gap-1.5 py-1 hover:bg-[rgba(0,212,255,0.06)] rounded transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <span className="text-[8px] font-mono font-bold text-[var(--trench-text-muted)] w-3">{i + 1}.</span>
          <div className="w-4 h-4 rounded-full overflow-hidden ring-1 ring-[rgba(0,212,255,0.1)]">
            <AvatarImage src={getPublicAvatarUrl(trader.username, trader.avatarUrl)} alt={trader.displayName} width={16} height={16} className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] font-semibold text-white truncate flex-1">{trader.displayName}</span>
          <span className="text-[8px] font-mono font-bold" style={{ color: trader.pnlUsd >= 0 ? '#22c55e' : '#ef4444' }}>
            {trader.pnlUsd >= 0 ? '+' : ''}${Math.round(trader.pnlUsd)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function MatchCard({ matchup }: { matchup: Matchup }) {
  const renderTrader = (trader: RankedTrader | null, side: 'top' | 'bottom') => {
    if (!trader) {
      return (
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ opacity: 0.2 }}>
          <div className="w-7 h-7 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <span className="text-[9px] font-mono text-[var(--trench-text-muted)]">TBD</span>
        </div>
      );
    }
    const isWinner = matchup.winner?.username === trader.username;
    return (
      <Link
        href={`/${trader.username}`}
        className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-[rgba(0,212,255,0.06)] group"
        style={{
          opacity: isWinner ? 1 : 0.4,
          background: isWinner ? 'linear-gradient(90deg, rgba(0,212,255,0.08), transparent)' : 'transparent',
          borderLeft: isWinner ? '2px solid #00D4FF' : '2px solid transparent',
          borderBottom: side === 'top' ? '1px solid rgba(255,255,255,0.03)' : 'none',
          textDecoration: 'none',
        }}
      >
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[rgba(0,212,255,0.15)] group-hover:ring-[rgba(0,212,255,0.3)] transition-all">
          <AvatarImage src={getPublicAvatarUrl(trader.username, trader.avatarUrl)} alt={trader.displayName} width={28} height={28} className="w-full h-full object-cover" />
        </div>
        <span className="min-w-0 flex-1 text-[10px] font-semibold text-white truncate group-hover:text-[var(--trench-accent)] transition-colors">
          {isWinner && '👑 '}@{trader.username}
        </span>
        <span className="text-[9px] font-mono font-bold flex-shrink-0" style={{ color: trader.pnlUsd >= 0 ? '#22c55e' : '#ef4444', textDecoration: isWinner ? 'none' : 'line-through' }}>
          {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000 ? `${Math.round(trader.pnlUsd / 1000)}K` : Math.round(trader.pnlUsd)}
        </span>
      </Link>
    );
  };

  return (
    <div className="cut-sm overflow-hidden" style={{ background: 'rgba(8,12,18,0.85)', border: '1px solid rgba(0,212,255,0.08)' }}>
      {renderTrader(matchup.trader1, 'top')}
      {renderTrader(matchup.trader2, 'bottom')}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────

export default function BracketOptionsPreview() {
  const [option, setOption] = useState<1 | 2 | 3>(1);

  const options = [
    { key: 1 as const, label: 'TABBED', icon: LayoutGrid, desc: 'Tap to switch between rounds. One round at a time.' },
    { key: 2 as const, label: 'HORIZONTAL SCROLL', icon: Maximize2, desc: 'Everything visible. Scroll right to see all rounds.' },
    { key: 3 as const, label: 'HYBRID', icon: ChevronRight, desc: 'Groups summary on top. Knockout scrolls.' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#050508' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] font-mono tracking-[4px] text-[var(--trench-accent)] mb-2">BRACKET OPTIONS</div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Choose the <span style={{ color: '#00D4FF' }}>Trencher Cup</span> Layout
          </h1>
          <p className="mt-2 text-[13px] text-[var(--trench-text-muted)]">
            3 options below. Click each to preview. Pick your favorite or mix elements.
          </p>
        </div>

        {/* Option Selector */}
        <div className="flex flex-wrap gap-3 mb-8">
          {options.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => setOption(key)}
              className="flex-1 min-w-[200px] cut-sm px-4 py-3 text-left transition-all"
              style={{
                background: option === key ? 'rgba(0,212,255,0.08)' : 'rgba(8,12,18,0.5)',
                border: option === key ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: option === key ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)' }}>
                  <Icon size={14} style={{ color: option === key ? '#00D4FF' : 'var(--trench-text-muted)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-[2px]" style={{ color: option === key ? '#00D4FF' : 'var(--trench-text-muted)' }}>OPTION {key}</span>
              </div>
              <div className="text-[14px] font-bold text-white">{label}</div>
              <div className="text-[10px] text-[var(--trench-text-muted)] mt-0.5">{desc}</div>
            </button>
          ))}
        </div>

        {/* Selected Option Preview */}
        <div
          className="cut-sm p-6"
          style={{ background: 'rgba(8,12,18,0.6)', border: '1px solid rgba(0,212,255,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="px-2 py-0.5 text-[8px] font-mono tracking-[2px]" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
              OPTION {option} PREVIEW
            </div>
          </div>

          {option === 1 && <Option1Tabbed />}
          {option === 2 && <Option2HorizontalScroll />}
          {option === 3 && <Option3Hybrid />}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a href="/preview" className="text-[10px] font-mono text-[var(--trench-text-muted)] hover:text-[var(--trench-accent)] transition-colors">
            ← Back to preview index
          </a>
        </div>
      </div>
    </div>
  );
}
