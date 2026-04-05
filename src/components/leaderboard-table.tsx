'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Crosshair, Zap, Anchor, Gem } from 'lucide-react';
import { GlassCard } from '@/components/glass-card';
import { TournamentBracket } from './tournament/tournament-bracket';
import { formatPnl } from '@/lib/utils';

const PERIODS = [
  { key: '1d', label: '1D' },
  { key: '3d', label: '3D' },
  { key: '7d', label: '7D' },
  { key: 'all', label: 'ALL' },
] as const;

interface RankedTrader {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isClaimed?: boolean;
  pnlUsd: number;
  pnlSol: number;
  winRate: number;
  trades: number;
}

/** Assign a category badge based on trading behavior */
function getCategoryBadge(t: RankedTrader): { icon: React.ReactNode; label: string; color: string } | null {
  if (t.winRate >= 70) return { icon: <Crosshair size={9} />, label: 'SNIPER', color: '#f59e0b' };
  if (t.trades >= 100) return { icon: <Zap size={9} />, label: 'ACTIVE', color: '#00D4FF' };
  if (t.pnlUsd >= 5000) return { icon: <Anchor size={9} />, label: 'WHALE', color: '#a78bfa' };
  if (t.winRate >= 50 && t.trades >= 20) return { icon: <Gem size={9} />, label: 'SOLID', color: '#22c55e' };
  return null;
}

function PodiumCard({ trader, place }: { trader: RankedTrader; place: 1 | 2 | 3 }) {
  const config = {
    1: { label: '1ST', color: '#FFD700', borderColor: 'rgba(255,215,0,0.2)', avatarSize: 64, fontSize: '22px', glow: true },
    2: { label: '2ND', color: '#C0C0C0', borderColor: 'rgba(192,192,192,0.15)', avatarSize: 48, fontSize: '16px', glow: false },
    3: { label: '3RD', color: '#CD7F32', borderColor: 'rgba(205,127,50,0.15)', avatarSize: 48, fontSize: '16px', glow: false },
  }[place];

  const badge = getCategoryBadge(trader);
  const isPositive = trader.pnlUsd >= 0;

  return (
    <Link href={`/${trader.username}`} className="block">
      <GlassCard cut={10} glow={place === 1}>
        <div style={{ height: place === 1 ? '3px' : '2px', background: `linear-gradient(90deg, transparent 10%, ${config.color} 50%, transparent 90%)` }} />
        <div className="text-center" style={{ padding: place === 1 ? '22px 12px 18px' : '18px 12px 14px' }}>
          <div className="font-mono font-black tracking-[3px] mb-2.5" style={{ fontSize: place === 1 ? '13px' : '11px', color: config.color, textShadow: config.glow ? `0 0 20px ${config.color}40` : 'none' }}>
            {config.label}
          </div>
          <div
            className="mx-auto mb-2.5 rounded-full overflow-hidden"
            style={{
              width: config.avatarSize, height: config.avatarSize,
              border: `${place === 1 ? 3 : 2.5}px solid ${config.color}80`,
              boxShadow: config.glow ? `0 0 30px ${config.color}25` : `0 0 20px ${config.color}15`,
            }}
          >
            <Image src={trader.avatarUrl || `https://unavatar.io/twitter/${trader.username}`} alt={trader.displayName} width={config.avatarSize} height={config.avatarSize} className="w-full h-full object-cover" unoptimized />
          </div>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className="font-bold text-white" style={{ fontSize: place === 1 ? '13px' : '11px' }}>@{trader.username}</span>
            {trader.isClaimed && (
              <div className="w-[12px] h-[12px] rounded-full flex items-center justify-center" style={{ background: '#00D4FF' }}>
                <Check size={7} strokeWidth={3} className="text-black" />
              </div>
            )}
          </div>
          {badge && (
            <div className="flex justify-center mt-1 mb-2">
              <span className="cut-xs text-[6px] tracking-[1px] px-2 py-0.5 font-semibold" style={{ color: badge.color, background: `${badge.color}14`, border: `1px solid ${badge.color}20` }}>
                {badge.icon} {badge.label}
              </span>
            </div>
          )}
          <div className="font-mono font-black mt-2" style={{ fontSize: config.fontSize, color: isPositive ? 'var(--trench-green)' : 'var(--trench-red)', textShadow: config.glow && isPositive ? '0 0 20px rgba(34,197,94,0.2)' : 'none' }}>
            {formatPnl(trader.pnlUsd)}
          </div>
          <div className="font-mono text-[8px] text-[var(--trench-text-muted)] mt-1">
            {trader.winRate.toFixed(0)}% · {trader.trades} trades
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

interface RankedDeployer {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isClaimed?: boolean;
  totalDevPnlSol: number;
  totalDevPnlUsd: number;
  deployCount: number;
  migratedCount: number;
  bestToken: string | null;
  bestTokenPnl: number;
}

type LeaderboardMode = 'traders' | 'deployers';

const PAGE_SIZE = 10;

export function LeaderboardTable({ initialPeriod = '7d', initialTraders }: { initialPeriod?: string; initialTraders?: RankedTrader[] }) {
  const [mode, setMode] = useState<LeaderboardMode>('traders');
  const [viewMode, setViewMode] = useState<'table' | 'bracket'>('table');
  const [period, setPeriod] = useState(initialPeriod);
  const [traders, setTraders] = useState<RankedTrader[]>(initialTraders ?? []);
  const [deployers, setDeployers] = useState<RankedDeployer[]>([]);
  const [loading, setLoading] = useState(!initialTraders);
  const [page, setPage] = useState(0);
  const [initialLoad, setInitialLoad] = useState(!!initialTraders);

  useEffect(() => {
    setPage(0);
    if (mode === 'deployers') setViewMode('table');
  }, [mode, period]);

  useEffect(() => {
    // Skip first fetch if we have server-provided data
    if (initialLoad && mode === 'traders' && period === initialPeriod) {
      setInitialLoad(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    if (mode === 'traders') {
      fetch(`/api/leaderboard?period=${period}&limit=50`)
        .then((res) => res.json())
        .then((data) => { if (!cancelled) { setTraders(Array.isArray(data) ? data : []); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    } else {
      fetch(`/api/leaderboard/deployers?limit=50`)
        .then((res) => res.json())
        .then((data) => { if (!cancelled) { setDeployers(Array.isArray(data) ? data : []); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [mode, period]);

  // Normalize deployers to RankedTrader shape for shared podium/table
  const deployerAsTraders: RankedTrader[] = useMemo(() => deployers.map(d => ({
    rank: d.rank,
    username: d.username,
    displayName: d.displayName,
    avatarUrl: d.avatarUrl,
    isClaimed: d.isClaimed,
    pnlUsd: d.totalDevPnlUsd,
    pnlSol: d.totalDevPnlSol,
    winRate: d.deployCount > 0 ? (d.migratedCount / d.deployCount) * 100 : 0,
    trades: d.deployCount,
  })), [deployers]);

  const activeList = mode === 'traders' ? traders : deployerAsTraders;
  const top3 = activeList.slice(0, 3);
  const allRest = activeList.slice(3);
  const totalPages = Math.ceil(allRest.length / PAGE_SIZE);
  const rest = allRest.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Left: Traders / Devs toggle */}
        <div className="flex items-center gap-2">
          {(['traders', 'deployers'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="font-mono text-[10px] tracking-[1.5px] font-bold px-4 py-1.5 transition-all cut-sm"
              style={{
                background: mode === m ? 'rgba(0,212,255,0.18)' : 'rgba(8,12,22,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: mode === m ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.07)',
                color: mode === m ? '#00D4FF' : '#71717a',
              }}
            >
              {m === 'traders' ? 'TRADERS' : 'DEVS'}
            </button>
          ))}
        </div>

        {/* Right: Period selector + View selector */}
        {mode === 'traders' && (
          <div className="flex items-center gap-3">
            {/* Period dropdown */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="appearance-none font-mono text-[10px] tracking-[1.5px] font-semibold pl-3 pr-7 py-1.5 cut-xs cursor-pointer"
                style={{
                  background: 'rgba(8,12,22,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  color: '#00D4FF',
                  outline: 'none',
                }}
              >
                {PERIODS.map((p) => (
                  <option key={p.key} value={p.key} style={{ background: '#0a0a12', color: '#00D4FF' }}>{p.label}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-[var(--trench-accent)]">▼</div>
            </div>

            {/* Separator */}
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

            {/* View dropdown */}
            <div className="relative">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
                className="appearance-none font-mono text-[9px] tracking-widest font-semibold pl-3 pr-7 py-1.5 cut-xs cursor-pointer uppercase"
                style={{
                  background: 'rgba(8,12,22,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  color: '#00D4FF',
                  outline: 'none',
                }}
              >
                <option value="table" style={{ background: '#0a0a12', color: '#00D4FF' }}>TABLE</option>
                <option value="bracket" style={{ background: '#0a0a12', color: '#00D4FF' }} disabled={activeList.length < 32}>BRACKET</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-[var(--trench-accent)]">▼</div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="text-[11px] font-mono text-[var(--trench-text-muted)] animate-pulse">Loading rankings...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && activeList.length === 0 && (
        <GlassCard cut={10} glow={false}>
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-[13px] text-[var(--trench-text-muted)]">No rankings yet</span>
            <span className="text-[10px] text-[var(--trench-text-muted)]">Rankings refresh every 4 hours</span>
          </div>
        </GlassCard>
      )}

      {/* Bracket view */}
      {!loading && viewMode === 'bracket' && mode === 'traders' && (
        <TournamentBracket traders={activeList} />
      )}

      {/* Split layout: Podium left + List right */}
      {!loading && !(viewMode === 'bracket' && mode === 'traders') && top3.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-0 items-stretch">
          {/* LEFT — Top 3 podium cards */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-2">
            {/* #1 — big card with PFP background */}
            {top3[0] && (
              <Link href={`/${top3[0].username}`} className="block flex-[1.2] relative overflow-hidden cut-sm group" style={{ minHeight: '120px' }}>
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{
                  backgroundImage: `url(${top3[0].avatarUrl || `https://unavatar.io/twitter/${top3[0].username}`})`,
                  backgroundSize: 'cover', backgroundPosition: 'center 20%',
                  filter: 'brightness(0.55) saturate(1.2)',
                }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(5,5,8,0.75) 50%, rgba(5,5,8,0.95) 100%)' }} />
                <div className="absolute inset-0 border border-[rgba(255,215,0,0.25)] cut-sm pointer-events-none" />
                <div className="absolute top-2.5 right-3 text-[20px] z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }}>👑</div>
                <div className="relative z-1 h-full flex flex-col justify-end p-4">
                  <div className="text-[8px] tracking-[3px] font-mono mb-1" style={{ color: '#FFD700' }}>1ST PLACE</div>
                  <div className="text-[14px] font-black text-white mb-0.5">@{top3[0].username}</div>
                  <div className="text-[8px] text-[rgba(255,255,255,0.4)] mb-2">{Math.round(top3[0].winRate)}% WR · {top3[0].trades} trades</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[24px] font-black font-mono" style={{ color: '#22c55e', textShadow: '0 0 16px rgba(34,197,94,0.3)' }}>+{Math.round(top3[0].pnlSol)}</span>
                    <Image src="/sol.png" alt="SOL" width={18} height={18} className="h-[18px] w-auto" />
                  </div>
                </div>
              </Link>
            )}

            {/* #2 and #3 side by side */}
            <div className="flex gap-2 flex-1">
              {top3[1] && (
                <Link href={`/${top3[1].username}`} className="block flex-1 relative overflow-hidden cut-sm group" style={{ minHeight: '100px' }}>
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{
                    backgroundImage: `url(${top3[1].avatarUrl || `https://unavatar.io/twitter/${top3[1].username}`})`,
                    backgroundSize: 'cover', backgroundPosition: 'center 20%',
                    filter: 'brightness(0.5) saturate(1.1)',
                  }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.1) 0%, rgba(5,5,8,0.9) 75%)' }} />
                  <div className="absolute inset-0 border border-[rgba(192,192,192,0.2)] cut-sm pointer-events-none" />
                  <div className="relative z-1 h-full flex flex-col justify-end p-3">
                    <div className="text-[7px] tracking-[2px] font-mono mb-1" style={{ color: '#C0C0C0' }}>2ND</div>
                    <div className="text-[11px] font-black text-white mb-1">@{top3[1].username}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[16px] font-black font-mono" style={{ color: '#22c55e' }}>+{Math.round(top3[1].pnlSol)}</span>
                      <Image src="/sol.png" alt="SOL" width={13} height={13} className="h-[13px] w-auto" />
                    </div>
                  </div>
                </Link>
              )}
              {top3[2] && (
                <Link href={`/${top3[2].username}`} className="block flex-1 relative overflow-hidden cut-sm group" style={{ minHeight: '100px' }}>
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{
                    backgroundImage: `url(${top3[2].avatarUrl || `https://unavatar.io/twitter/${top3[2].username}`})`,
                    backgroundSize: 'cover', backgroundPosition: 'center 20%',
                    filter: 'brightness(0.5) saturate(1.1)',
                  }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.1) 0%, rgba(5,5,8,0.9) 75%)' }} />
                  <div className="absolute inset-0 border border-[rgba(205,127,50,0.2)] cut-sm pointer-events-none" />
                  <div className="relative z-1 h-full flex flex-col justify-end p-3">
                    <div className="text-[7px] tracking-[2px] font-mono mb-1" style={{ color: '#CD7F32' }}>3RD</div>
                    <div className="text-[11px] font-black text-white mb-1">@{top3[2].username}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[16px] font-black font-mono" style={{ color: '#22c55e' }}>+{Math.round(top3[2].pnlSol)}</span>
                      <Image src="/sol.png" alt="SOL" width={13} height={13} className="h-[13px] w-auto" />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Separator — desktop only */}
          <div className="hidden lg:block w-px mx-4 flex-shrink-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.12) 20%, rgba(0,212,255,0.12) 80%, transparent)' }} />

          {/* RIGHT — Compact list #4+ */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center px-3 py-2 text-[7px] font-mono tracking-[2px] text-[#333]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="w-[22px]">#</span>
              <span className="w-[28px]" />
              <span className="flex-1 pl-2">{mode === 'traders' ? 'TRADER' : 'DEV'}</span>
              <span className="w-[40px] text-right hidden sm:block">WR</span>
              <span className="w-[80px] text-right">PNL</span>
            </div>

            {/* Rows */}
            {rest.map((t) => (
              <Link
                key={t.username}
                href={`/${t.username}`}
                className="flex items-center px-3 py-2.5 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', textDecoration: 'none' }}
              >
                <span className="w-[22px] font-mono text-[11px] font-bold text-[#444]">{t.rank}</span>
                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}>
                  <Image src={t.avatarUrl || `https://unavatar.io/twitter/${t.username}`} alt={t.displayName} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                </div>
                <span className="flex-1 min-w-0 pl-2 text-[12px] font-semibold text-white truncate">@{t.username}</span>
                <span className="w-[40px] text-right font-mono text-[10px] text-[#555] hidden sm:block">{Math.round(t.winRate)}%</span>
                <div className="w-[80px] flex items-center justify-end gap-1">
                  <span className="font-mono text-[13px] font-black" style={{ color: '#22c55e' }}>+{Math.round(t.pnlSol)}</span>
                  <Image src="/sol.png" alt="SOL" width={12} height={12} className="h-[12px] w-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* Pagination */}
      {!loading && !(viewMode === 'bracket' && mode === 'traders') && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="font-mono text-[10px] tracking-[1px] px-4 py-1.5 cut-xs transition-all disabled:opacity-30"
            style={{
              background: 'rgba(8,12,22,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,212,255,0.15)',
              color: '#00D4FF',
            }}
          >
            ← PREV
          </button>
          <span className="font-mono text-[10px] text-[var(--trench-text-muted)] tracking-[1px]">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="font-mono text-[10px] tracking-[1px] px-4 py-1.5 cut-xs transition-all disabled:opacity-30"
            style={{
              background: 'rgba(8,12,22,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,212,255,0.15)',
              color: '#00D4FF',
            }}
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
