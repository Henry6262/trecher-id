'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import { formatPnl } from '@/lib/utils';

const PERIODS = [
  { key: '1d', label: '1D' },
  { key: '3d', label: '3D' },
  { key: '7d', label: '7D' },
  { key: 'all', label: 'ALL TIME' },
] as const;

interface RankedTrader {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  pnlUsd: number;
  pnlSol: number;
  winRate: number;
  trades: number;
}

export function LeaderboardTable({ initialPeriod = '7d' }: { initialPeriod?: string }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [traders, setTraders] = useState<RankedTrader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/leaderboard?period=${period}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setTraders(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div>
      {/* Period tabs */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="font-mono text-[11px] tracking-[1px] px-4 py-2 transition-all"
            style={{
              background:
                period === p.key ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
              border:
                period === p.key
                  ? '1px solid rgba(0,212,255,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              color: period === p.key ? '#00D4FF' : '#71717a',
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard cut={10} glow={false} bg="rgba(8, 12, 18, 0.6)">
        <div className="overflow-x-auto">
          {/* Header */}
          <div
            className="grid items-center gap-3 px-5 py-3 text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] border-b"
            style={{
              gridTemplateColumns: '40px 1fr 120px 80px 60px',
              borderColor: 'rgba(0,212,255,0.08)',
            }}
          >
            <span>#</span>
            <span>TRADER</span>
            <span className="text-right">PnL</span>
            <span className="text-right">WIN RATE</span>
            <span className="text-right">TRADES</span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-[11px] font-mono text-[var(--trench-text-muted)] animate-pulse">
                Loading rankings...
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && traders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-[13px] text-[var(--trench-text-muted)]">No rankings yet</span>
              <span className="text-[10px] text-[var(--trench-text-muted)]">
                Rankings refresh every 4 hours
              </span>
            </div>
          )}

          {/* Rows */}
          {!loading &&
            traders.map((t) => {
              const isPositive = t.pnlUsd >= 0;
              return (
                <Link
                  key={t.username}
                  href={`/${t.username}`}
                  className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
                  style={{
                    gridTemplateColumns: '40px 1fr 120px 80px 60px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  {/* Rank */}
                  <span
                    className="font-mono text-[13px] font-bold"
                    style={{
                      color:
                        t.rank === 1
                          ? '#FFD700'
                          : t.rank === 2
                            ? '#C0C0C0'
                            : t.rank === 3
                              ? '#CD7F32'
                              : '#71717a',
                    }}
                  >
                    {t.rank}
                  </span>

                  {/* Trader info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full"
                      style={{
                        border: '1.5px solid rgba(0,212,255,0.2)',
                      }}
                    >
                      <Image
                        src={
                          t.avatarUrl || `https://unavatar.io/twitter/${t.username}`
                        }
                        alt={t.displayName}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-white truncate">
                        @{t.username}
                      </div>
                      <div className="text-[9px] text-[var(--trench-text-muted)] truncate">
                        {t.displayName}
                      </div>
                    </div>
                  </div>

                  {/* PnL */}
                  <div className="text-right">
                    <div
                      className="font-mono text-[13px] font-bold"
                      style={{
                        color: isPositive ? 'var(--trench-green)' : 'var(--trench-red)',
                      }}
                    >
                      {formatPnl(t.pnlUsd)}
                    </div>
                    <div className="font-mono text-[9px] text-[var(--trench-text-muted)]">
                      {t.pnlSol >= 0 ? '+' : ''}
                      {t.pnlSol.toFixed(1)} SOL
                    </div>
                  </div>

                  {/* Win rate */}
                  <div
                    className="text-right font-mono text-[12px] font-semibold"
                    style={{ color: 'var(--trench-accent)' }}
                  >
                    {t.winRate.toFixed(0)}%
                  </div>

                  {/* Trades */}
                  <div className="text-right font-mono text-[12px] text-[var(--trench-text)]">
                    {t.trades}
                  </div>
                </Link>
              );
            })}
        </div>
      </GlassCard>
    </div>
  );
}
