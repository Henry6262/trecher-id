'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TickerItem } from '@/lib/types';

interface ActivityTickerProps {
  items: TickerItem[];
}

export function ActivityTicker({ items }: ActivityTickerProps) {
  const [paused, setPaused] = useState(false);

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          overflow: 'hidden',
          background: 'rgba(0,212,255,0.02)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(0,212,255,0.08)',
          borderBottom: '1px solid rgba(0,212,255,0.08)',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            animation: 'ticker-scroll 50s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {doubled.map((item, i) => {
            const isGain = item.pnlPercent >= 0;
            const pnlColor = isGain ? 'var(--trench-green)' : 'var(--trench-red)';
            const sign = isGain ? '+' : '';

            return (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0 20px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  letterSpacing: '0.5px',
                  color: 'var(--trench-text-muted)',
                }}
              >
                {isGain
                  ? <TrendingUp size={10} style={{ color: pnlColor, flexShrink: 0 }} strokeWidth={2} />
                  : <TrendingDown size={10} style={{ color: pnlColor, flexShrink: 0 }} strokeWidth={2} />
                }
                <span style={{ color: 'var(--trench-text)' }}>@{item.username}</span>
                <span>·</span>
                <span style={{ color: 'var(--trench-text)' }}>${item.tokenSymbol}</span>
                <span>·</span>
                <span style={{ color: pnlColor, fontWeight: 700 }}>
                  {sign}{item.pnlPercent.toFixed(0)}%
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
