'use client';

import Link from 'next/link';
import { AvatarImage } from '@/components/avatar-image';
import type { Group } from './bracket-utils';

export function GroupCard({ group }: { group: Group }) {
  return (
    <div
      style={{
        background: 'rgba(8,12,18,0.9)',
        border: '1px solid rgba(0,212,255,0.1)',
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
      }}
    >
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
        const statusLabel = qualified ? 'ADV' : 'OUT';
        return (
          <Link
            key={trader.username}
            href={`/${trader.username}`}
            className="flex items-center gap-2 px-3 transition-colors hover:bg-[rgba(0,212,255,0.03)]"
            style={{
              height: 40,
              opacity: qualified ? 1 : 0.45,
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
              <AvatarImage
                src={trader.avatarUrl || `https://unavatar.io/twitter/${trader.username}`}
                alt={trader.displayName}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Username */}
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-white truncate">
                @{trader.username}
              </span>
              <span className="block text-[7px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                {qualified ? 'Top 2 advance' : 'Needs higher rank'}
              </span>
            </div>

            <span
              className="text-[7px] font-mono tracking-[1.5px] px-1.5 py-0.5 cut-xs flex-shrink-0"
              style={{
                color: qualified ? '#00D4FF' : 'rgba(255,255,255,0.45)',
                background: qualified ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: qualified ? '1px solid rgba(0,212,255,0.16)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {statusLabel}
            </span>

            {/* PnL */}
            <span
              className="text-[10px] font-mono font-bold flex-shrink-0"
              style={{ color: trader.pnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)' }}
            >
              {trader.pnlUsd >= 0 ? '+' : ''}${Math.abs(trader.pnlUsd) >= 1000
                ? `${Math.round(trader.pnlUsd / 1000)}K`
                : Math.round(trader.pnlUsd)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
