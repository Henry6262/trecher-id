'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { GlassCard } from '@/components/glass-card';
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
function getCategoryBadge(t: RankedTrader): { emoji: string; label: string; color: string } | null {
  if (t.winRate >= 70) return { emoji: '🎯', label: 'SNIPER', color: '#f59e0b' };
  if (t.trades >= 100) return { emoji: '⚡', label: 'ACTIVE', color: '#00D4FF' };
  if (t.pnlUsd >= 5000) return { emoji: '🐋', label: 'WHALE', color: '#a78bfa' };
  if (t.winRate >= 50 && t.trades >= 20) return { emoji: '💎', label: 'SOLID', color: '#22c55e' };
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
            <div className="w-[12px] h-[12px] rounded-full flex items-center justify-center" style={{ background: '#00D4FF' }}>
              <Check size={7} strokeWidth={3} className="text-black" />
            </div>
          </div>
          {badge && (
            <div className="flex justify-center mt-1 mb-2">
              <span className="cut-xs text-[6px] tracking-[1px] px-2 py-0.5 font-semibold" style={{ color: badge.color, background: `${badge.color}14`, border: `1px solid ${badge.color}20` }}>
                {badge.emoji} {badge.label}
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

export function LeaderboardTable({ initialPeriod = '7d' }: { initialPeriod?: string }) {
  const [mode, setMode] = useState<LeaderboardMode>('traders');
  const [period, setPeriod] = useState(initialPeriod);
  const [traders, setTraders] = useState<RankedTrader[]>([]);
  const [deployers, setDeployers] = useState<RankedDeployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [mode, period]);

  useEffect(() => {
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
  const deployerAsTraders: RankedTrader[] = deployers.map(d => ({
    rank: d.rank,
    username: d.username,
    displayName: d.displayName,
    avatarUrl: d.avatarUrl,
    isClaimed: d.isClaimed,
    pnlUsd: d.totalDevPnlUsd,
    pnlSol: d.totalDevPnlSol,
    winRate: d.deployCount > 0 ? (d.migratedCount / d.deployCount) * 100 : 0,
    trades: d.deployCount,
  }));

  const activeList = mode === 'traders' ? traders : deployerAsTraders;
  const top3 = activeList.slice(0, 3);
  const allRest = activeList.slice(3);
  const totalPages = Math.ceil(allRest.length / PAGE_SIZE);
  const rest = allRest.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      {/* Mode toggle — Traders / Deployers */}
      <div className="flex gap-2 mb-4">
        {(['traders', 'deployers'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="font-mono text-[11px] tracking-[1px] font-bold px-5 py-2 transition-all cut-sm"
            style={{
              background: mode === m ? 'rgba(0,212,255,0.18)' : 'rgba(8,12,22,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: mode === m ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.07)',
              color: mode === m ? '#00D4FF' : '#71717a',
            }}
          >
            {m === 'traders' ? '📊 TRADERS' : '🚀 DEPLOYERS'}
          </button>
        ))}
      </div>

      {/* Period tabs — only for traders */}
      {mode === 'traders' && (
        <div className="flex gap-2 mb-6">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="font-mono text-[10px] tracking-[1.5px] font-semibold px-4 py-1.5 transition-all cut-xs"
              style={{
                background: period === p.key ? 'rgba(0,212,255,0.18)' : 'rgba(8,12,22,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: period === p.key ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: period === p.key ? '#00D4FF' : '#71717a',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

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

      {/* Podium — top 3 */}
      {!loading && top3.length > 0 && (
        <div className="relative mb-8">
          <div className="absolute inset-[-20px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(255,215,0,0.04) 0%, transparent 50%)' }} />
          <div className="relative grid gap-3 items-end" style={{ gridTemplateColumns: top3.length >= 3 ? '1fr 1.2fr 1fr' : `repeat(${top3.length}, 1fr)` }}>
            {top3.length >= 2 && <PodiumCard trader={top3[1]} place={2} />}
            {top3.length >= 1 && <PodiumCard trader={top3[0]} place={1} />}
            {top3.length >= 3 && <PodiumCard trader={top3[2]} place={3} />}
          </div>
        </div>
      )}

      {/* Rest of table — 4th onward */}
      {!loading && rest.length > 0 && (
        <GlassCard cut={10} glow={false} bg="rgba(8,12,18,0.6)">
          <div className="overflow-x-auto">
            {/* Header */}
            <div
              className="grid items-center gap-3 px-5 py-2.5 text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)]"
              style={{ gridTemplateColumns: '32px 1fr 100px 60px', borderBottom: '1px solid rgba(0,212,255,0.06)' }}
            >
              <span>#</span>
              <span>{mode === 'traders' ? 'TRADER' : 'DEPLOYER'}</span>
              <span className="text-right">{mode === 'traders' ? 'PnL' : 'DEV PnL'}</span>
              <span className="text-right">{mode === 'traders' ? 'WIN' : 'MIGRATED'}</span>
            </div>

            {rest.map((t) => {
              const badge = getCategoryBadge(t);
              return (
                <Link
                  key={t.username}
                  href={`/${t.username}`}
                  className="grid items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
                  style={{ gridTemplateColumns: '32px 1fr 100px 60px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                >
                  <span className="font-mono text-[12px] font-bold text-[var(--trench-text-muted)]">{t.rank}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full" style={{ border: '1.5px solid rgba(0,212,255,0.2)' }}>
                      <Image src={t.avatarUrl || `https://unavatar.io/twitter/${t.username}`} alt={t.displayName} width={28} height={28} className="h-full w-full object-cover" unoptimized />
                    </div>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-white truncate">@{t.username}</span>
                      {t.isClaimed && (
                        <span className="ml-1 text-[10px] font-mono text-[#00D4FF]">✓</span>
                      )}
                      {badge && (
                        <span className="cut-xs text-[6px] tracking-[0.5px] px-1.5 py-0.5 font-semibold flex-shrink-0" style={{ color: badge.color, background: `${badge.color}14`, border: `1px solid ${badge.color}20` }}>
                          {badge.emoji} {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] font-bold" style={{ color: t.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)' }}>
                      {formatPnl(t.pnlUsd)}
                    </div>
                    <div className="font-mono text-[8px] text-[var(--trench-text-muted)]">{t.pnlSol >= 0 ? '+' : ''}{t.pnlSol.toFixed(1)} SOL</div>
                  </div>
                  <div className="text-right font-mono text-[11px] font-semibold text-[var(--trench-accent)]">{t.winRate.toFixed(0)}%</div>
                </Link>
              );
            })}
          </div>
        </GlassCard>
      )}
      {/* Pagination */}
      {!loading && totalPages > 1 && (
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
