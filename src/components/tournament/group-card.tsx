'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import type { Group } from './bracket-utils';

export function GroupCard({ group }: { group: Group }) {
  return (
    <GlassCard cut={8} glow={false}>
      {/* Header */}
      <div
        className="px-3 py-2"
        style={{ background: 'rgba(0,212,255,0.04)', borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <span className="text-[9px] font-mono tracking-[2px] text-[#00D4FF]">
          GROUP {group.name}
        </span>
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
              height: 36,
              opacity: qualified ? 1 : 0.4,
              borderLeft: qualified ? '2px solid #00D4FF' : '2px solid transparent',
              background: qualified ? 'rgba(0,212,255,0.04)' : 'transparent',
            }}
          >
            {/* Position */}
            <span className="text-[10px] font-mono font-bold text-[var(--trench-text-muted)] w-4 text-center flex-shrink-0">
              {i + 1}
            </span>

            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: '1.5px solid rgba(0,212,255,0.15)' }}
            >
              <Image
                src={trader.avatarUrl || `https://unavatar.io/twitter/${trader.username}`}
                alt={trader.displayName}
                width={24}
                height={24}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            {/* Username */}
            <span className="text-[10px] font-semibold text-white truncate min-w-0 flex-1">
              @{trader.username}
            </span>

            {/* PnL */}
            <span
              className="text-[10px] font-mono font-bold flex-shrink-0"
              style={{ color: trader.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)' }}
            >
              {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000
                ? `${(trader.pnlUsd / 1000).toFixed(1)}K`
                : Math.round(trader.pnlUsd)}
            </span>
          </Link>
        );
      })}
    </GlassCard>
  );
}
