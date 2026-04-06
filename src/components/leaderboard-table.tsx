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
  const [period, setPeriod] = useState(initialPeriod);
  const [traders, setTraders] = useState<RankedTrader[]>(initialTraders ?? []);
  const [loading, setLoading] = useState(!initialTraders);
  const [initialLoad, setInitialLoad] = useState(!!initialTraders);

  useEffect(() => {
    if (initialLoad && period === initialPeriod) {
      setInitialLoad(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&limit=50`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) { setTraders(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  return (
    <div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="text-[11px] font-mono text-[var(--trench-text-muted)] animate-pulse">Loading rankings...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && traders.length === 0 && (
        <GlassCard cut={10} glow={false}>
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-[13px] text-[var(--trench-text-muted)]">No rankings yet</span>
            <span className="text-[10px] text-[var(--trench-text-muted)]">Rankings refresh every 4 hours</span>
          </div>
        </GlassCard>
      )}

      {/* Bracket view */}
      {!loading && (
        <TournamentBracket traders={traders} />
      )}

    </div>
  );
}
