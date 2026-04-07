'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AvatarImage } from '@/components/avatar-image';
import { GlassCard } from '@/components/glass-card';
import { TournamentBracket } from './tournament/tournament-bracket';

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

export function LeaderboardTable({
  initialPeriod = '7d',
  initialTraders,
  variant = 'full',
}: {
  initialPeriod?: string;
  initialTraders?: RankedTrader[];
  variant?: 'bracket' | 'full';
}) {
  const [mode, setMode] = useState<LeaderboardMode>('traders');
  const [period, setPeriod] = useState(initialPeriod);
  const [traders, setTraders] = useState<RankedTrader[]>(initialTraders ?? []);
  const [deployers, setDeployers] = useState<RankedDeployer[]>([]);
  const [loading, setLoading] = useState(!initialTraders);
  const [page, setPage] = useState(0);
  const skippedInitialFetch = useRef(!!initialTraders);

  useEffect(() => {
    if (skippedInitialFetch.current && mode === 'traders' && period === initialPeriod) {
      skippedInitialFetch.current = false;
      return;
    }

    let cancelled = false;
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
  }, [mode, period, initialPeriod]);

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
  const deployerByUsername = useMemo(
    () => new Map(deployers.map((deployer) => [deployer.username, deployer])),
    [deployers],
  );

  const activeList = mode === 'traders' ? traders : deployerAsTraders;
  const top3 = activeList.slice(0, 3);
  const allRest = activeList.slice(3);
  const totalPages = Math.ceil(allRest.length / PAGE_SIZE);
  const rest = allRest.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // ─── Bracket-only mode (landing page) ───────────────────────
  if (variant === 'bracket') {
    return (
      <div>
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="text-[11px] font-mono text-[var(--trench-text-muted)] animate-pulse">Loading rankings...</span>
          </div>
        )}
        {!loading && traders.length === 0 && (
          <GlassCard cut={10} glow={false}>
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-[13px] text-[var(--trench-text-muted)]">No rankings yet</span>
            </div>
          </GlassCard>
        )}
        {!loading && <TournamentBracket traders={traders} />}
      </div>
    );
  }

  // ─── Full mode (leaderboard page) ───────────────────────────
  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          {(['traders', 'deployers'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setLoading(true);
                setMode(m);
                setPage(0);
              }}
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

        <div className="flex items-center gap-3">
          {mode === 'traders' && (
            <>
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setLoading(true);
                    setPeriod(p.key);
                    setPage(0);
                  }}
                  className="font-mono text-[10px] tracking-[1px] font-bold px-3 py-1 transition-all"
                  style={{
                    background: period === p.key ? 'rgba(0,212,255,0.15)' : 'transparent',
                    border: period === p.key ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    color: period === p.key ? '#00D4FF' : '#555',
                    borderRadius: 4,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
        <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {mode === 'traders' ? 'REALIZED PNL RANKING' : 'TOTAL DEV PNL RANKING'}
        </span>
        <span className="cut-xs px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {mode === 'traders' ? '7D CUP QUALIFICATION' : 'MIGRATIONS + DEPLOY COUNT'}
        </span>
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

      {/* Table view — Podium + List */}
      {!loading && top3.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-0 items-stretch">
          {/* LEFT — Top 3 */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-2">
            {top3[0] && (
              <Link href={`/${top3[0].username}`} className="block flex-[1.2] relative overflow-hidden cut-sm group" style={{ minHeight: '120px' }}>
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{
                  backgroundImage: `url(${top3[0].avatarUrl || `https://unavatar.io/twitter/${top3[0].username}`})`,
                  backgroundSize: 'cover', backgroundPosition: 'center 20%',
                  filter: 'brightness(0.55) saturate(1.2)',
                }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(5,5,8,0.75) 50%, rgba(5,5,8,0.95) 100%)' }} />
                <div className="absolute inset-0 border border-[rgba(255,215,0,0.25)] cut-sm pointer-events-none" />
                <div className="relative z-1 h-full flex flex-col justify-end p-4">
                  <div className="text-[8px] tracking-[3px] font-mono mb-1" style={{ color: '#FFD700' }}>1ST PLACE</div>
                  <div className="text-[14px] font-black text-white mb-0.5">@{top3[0].username}</div>
                  <div className="text-[8px] text-[rgba(255,255,255,0.4)] mb-2">
                    {mode === 'traders'
                      ? `${Math.round(top3[0].winRate)}% WR · ${top3[0].trades} trades`
                      : (() => {
                          const deployer = deployerByUsername.get(top3[0].username);
                          if (!deployer) return `${top3[0].trades} deploys`;
                          return `${deployer.deployCount} deploys · ${deployer.migratedCount} migrated`;
                        })()}
                  </div>
                  {mode === 'deployers' && deployerByUsername.get(top3[0].username)?.bestToken && (
                    <div className="mb-2 inline-flex items-center px-2 py-1 cut-xs text-[7px] font-mono tracking-[1.5px] text-white" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      BEST: ${deployerByUsername.get(top3[0].username)?.bestToken}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[24px] font-black font-mono" style={{ color: top3[0].pnlSol >= 0 ? '#22c55e' : '#ef4444', textShadow: '0 0 16px rgba(34,197,94,0.3)' }}>{top3[0].pnlSol >= 0 ? '+' : ''}{Math.round(top3[0].pnlSol)}</span>
                    <Image src="/sol.png" alt="SOL" width={18} height={18} className="h-[18px] w-auto" />
                  </div>
                </div>
              </Link>
            )}
            <div className="flex gap-2 flex-1">
              {[top3[1], top3[2]].map((t, idx) => t && (
                <Link key={t.username} href={`/${t.username}`} className="block flex-1 relative overflow-hidden cut-sm group" style={{ minHeight: '100px' }}>
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{
                    backgroundImage: `url(${t.avatarUrl || `https://unavatar.io/twitter/${t.username}`})`,
                    backgroundSize: 'cover', backgroundPosition: 'center 20%',
                    filter: 'brightness(0.5) saturate(1.1)',
                  }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.1) 0%, rgba(5,5,8,0.9) 75%)' }} />
                  <div className="absolute inset-0 border cut-sm pointer-events-none" style={{ borderColor: idx === 0 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)' }} />
                  <div className="relative z-1 h-full flex flex-col justify-end p-3">
                    <div className="text-[7px] tracking-[2px] font-mono mb-1" style={{ color: idx === 0 ? '#C0C0C0' : '#CD7F32' }}>{idx === 0 ? '2ND' : '3RD'}</div>
                    <div className="text-[11px] font-black text-white mb-1">@{t.username}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[16px] font-black font-mono" style={{ color: t.pnlSol >= 0 ? '#22c55e' : '#ef4444' }}>{t.pnlSol >= 0 ? '+' : ''}{Math.round(t.pnlSol)}</span>
                      <Image src="/sol.png" alt="SOL" width={13} height={13} className="h-[13px] w-auto" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-px mx-4 flex-shrink-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.12) 20%, rgba(0,212,255,0.12) 80%, transparent)' }} />

          {/* RIGHT — List #4+ */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center px-3 py-2 text-[7px] font-mono tracking-[2px] text-[#333]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="w-[22px]">#</span>
              <span className="w-[28px]" />
              <span className="flex-1 pl-2">{mode === 'traders' ? 'TRADER' : 'DEV'}</span>
              <span className="w-[52px] text-right hidden sm:block">{mode === 'traders' ? 'WR' : 'DEP'}</span>
              <span className="w-[80px] text-right">PNL</span>
            </div>
            {rest.map((t) => (
              <Link key={t.username} href={`/${t.username}`}
                className="flex items-center px-3 py-2.5 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', textDecoration: 'none' }}>
                <span className="w-[22px] font-mono text-[11px] font-bold text-[#444]">{t.rank}</span>
                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}>
                  <AvatarImage src={t.avatarUrl || `https://unavatar.io/twitter/${t.username}`} alt={t.displayName} width={28} height={28} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pl-2">
                  <span className="block text-[12px] font-semibold text-white truncate">@{t.username}</span>
                  {mode === 'deployers' && deployerByUsername.get(t.username)?.bestToken && (
                    <span className="block text-[8px] font-mono text-[var(--trench-text-muted)] truncate">
                      Best deploy: ${deployerByUsername.get(t.username)?.bestToken}
                    </span>
                  )}
                </div>
                <span className="w-[52px] text-right font-mono text-[10px] text-[#555] hidden sm:block">
                  {mode === 'traders'
                    ? `${Math.round(t.winRate)}%`
                    : String(deployerByUsername.get(t.username)?.deployCount ?? t.trades)}
                </span>
                <div className="w-[80px] flex items-center justify-end gap-1">
                  <span className="font-mono text-[13px] font-black" style={{ color: t.pnlSol >= 0 ? '#22c55e' : '#ef4444' }}>{t.pnlSol >= 0 ? '+' : ''}{Math.round(t.pnlSol)}</span>
                  <Image src="/sol.png" alt="SOL" width={12} height={12} className="h-[12px] w-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="font-mono text-[10px] tracking-[1px] px-4 py-1.5 cut-xs transition-all disabled:opacity-30"
            style={{ background: 'rgba(8,12,22,0.55)', border: '1px solid rgba(0,212,255,0.15)', color: '#00D4FF' }}>
            ← PREV
          </button>
          <span className="font-mono text-[10px] text-[var(--trench-text-muted)] tracking-[1px]">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="font-mono text-[10px] tracking-[1px] px-4 py-1.5 cut-xs transition-all disabled:opacity-30"
            style={{ background: 'rgba(8,12,22,0.55)', border: '1px solid rgba(0,212,255,0.15)', color: '#00D4FF' }}>
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
