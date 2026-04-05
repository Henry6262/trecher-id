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
  accentColor?: string | null;
}

export function ProfileStatsTabs({ username, allTimeStats, accentColor }: Props) {
  const accent = accentColor || '#00D4FF';
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
    <div className="flex gap-1.5">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => switchTab(t.key)}
          className="cut-xs px-2.5 py-1 text-[9px] font-mono tracking-widest transition-all"
          style={{
            background: active === t.key ? `${accent}2e` : 'rgba(8,12,22,0.55)',
            border: active === t.key ? `1px solid ${accent}4d` : '1px solid rgba(255,255,255,0.06)',
            color: active === t.key ? accent : '#71717a',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
