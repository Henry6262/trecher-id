'use client';
import { useState } from 'react';

const TABS = [
  { key: 'all', label: 'ALL' },
  { key: '7d',  label: '7D'  },
  { key: '3d',  label: '3D'  },
  { key: '1d',  label: '1D'  },
];

interface Stats { totalPnlUsd: number; winRate: number; totalTrades: number; }

interface Props {
  username: string;
  allTimeStats: Stats | null | undefined;
}

export function ProfileStatsTabs({ username, allTimeStats }: Props) {
  const [active, setActive] = useState('all');
  const [stats, setStats] = useState<Stats | null>(allTimeStats ?? null);
  const [loading, setLoading] = useState(false);

  async function switchTab(key: string) {
    if (key === active) return;
    setActive(key);
    if (key === 'all') { setStats(allTimeStats ?? null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/stats?username=${username}&period=${key}`);
      const data = await res.json();
      setStats(data ? { totalPnlUsd: data.pnlUsd, winRate: data.winRate, totalTrades: data.trades } : null);
    } finally { setLoading(false); }
  }

  if (!stats && !loading) return null;

  return (
    <div className="mt-5">
      {/* Tab pills */}
      <div className="flex gap-1.5 mb-3">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className="cut-xs px-2.5 py-1 text-[9px] font-mono tracking-widest transition-all"
            style={{
              background: active === t.key ? 'rgba(0,212,255,0.18)' : 'rgba(8,12,22,0.55)',
              border: active === t.key ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
              color: active === t.key ? '#00D4FF' : '#71717a',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats strip */}
      <div className={`flex gap-2 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
        {stats && [
          { value: `${stats.winRate.toFixed(0)}%`, label: 'WIN RATE', color: stats.winRate >= 50 ? 'var(--trench-green)' : 'var(--trench-red)' },
          { value: String(stats.totalTrades), label: 'TRADES', color: 'white' },
        ].map(s => (
          <div key={s.label} className="flex-1 relative cut-sm overflow-hidden" style={{ background: 'rgba(8,12,18,0.6)' }}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }} />
            <div className="flex flex-col items-center justify-center px-3 py-3" style={{ border: '1px solid rgba(0,212,255,0.1)', borderTop: 'none' }}>
              <span className="text-[17px] font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[8px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-1">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
