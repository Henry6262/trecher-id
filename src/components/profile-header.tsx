'use client';

import Image from 'next/image';
import { formatPnlFull, truncateAddress } from '@/lib/utils';
import { Check, ChevronDown, Star } from 'lucide-react';
import { useState } from 'react';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  username: string;
  bio?: string | null;
  verified?: boolean;
  stats?: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  wallets?: { address: string; verified: boolean; isMain?: boolean }[];
  roi?: number;
}

export function ProfileHeader({ avatarUrl, displayName, username, bio, verified, stats, wallets, roi }: ProfileHeaderProps) {
  const [activeWallet, setActiveWallet] = useState(
    () => wallets?.findIndex(w => w.isMain) ?? 0
  );
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <div
      className="relative"
      style={{
        padding: '32px 28px 24px',
        background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 100%)',
      }}
    >
      {/* Hero layout — avatar left, info right */}
      <div className="flex items-start gap-4">
        {/* Avatar — left side */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-[-12px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
          <div
            className="w-[88px] h-[88px] rounded-full overflow-hidden relative animate-[pulseGlow_3s_ease-in-out_infinite]"
            style={{ border: '3px solid rgba(0,212,255,0.4)' }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={88} height={88} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[32px] font-bold text-black" style={{ background: 'var(--trench-accent)' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Info — right side */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Name + badge */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="text-[20px] font-black text-white tracking-tight truncate">@{username}</h1>
            {verified && (
              <div className="w-[16px] h-[16px] flex items-center justify-center rounded-full flex-shrink-0" style={{ background: '#00D4FF' }}>
                <Check size={10} strokeWidth={3} className="text-black" />
              </div>
            )}
          </div>
          <span className="text-[11px] text-[var(--trench-text-muted)]">{displayName}</span>

          {/* Hero PnL */}
          {stats && (
            <div className="mt-2">
              <div
                className="font-mono text-[28px] font-black leading-none"
                style={{
                  color: stats.totalPnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
                  textShadow: stats.totalPnlUsd >= 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)',
                }}
              >
                {formatPnlFull(stats.totalPnlUsd)}
              </div>
              <div className="text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mt-1">TOTAL REALIZED PnL</div>
            </div>
          )}

          {/* Wallet selector */}
          {wallets && wallets.length > 0 && (
            <div className="mt-2 relative">
              <button
                onClick={() => setWalletOpen(!walletOpen)}
                className="cut-xs flex items-center gap-2 text-[9px] font-mono text-[var(--trench-text-muted)] px-2.5 py-1 transition-all hover:text-[var(--trench-accent)]"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}
              >
                {wallets[activeWallet]?.isMain && <Star size={8} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
                <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: wallets[activeWallet]?.verified ? '#22c55e' : '#71717a' }} />
                {truncateAddress(wallets[activeWallet]?.address || '')}
                <ChevronDown size={10} className={`transition-transform ${walletOpen ? 'rotate-180' : ''}`} />
              </button>

              {walletOpen && wallets.length > 1 && (
                <div
                  className="absolute top-full left-0 mt-1 cut-sm z-50"
                  style={{ background: 'rgba(8,12,18,0.95)', border: '1px solid rgba(0,212,255,0.12)', minWidth: '200px' }}
                >
                  {wallets.map((w, i) => (
                    <button
                      key={w.address}
                      onClick={() => { setActiveWallet(i); setWalletOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[9px] font-mono transition-all ${
                        i === activeWallet ? 'text-[var(--trench-accent)]' : 'text-[var(--trench-text-muted)] hover:text-[var(--trench-text)]'
                      }`}
                      style={{ background: i === activeWallet ? 'rgba(0,212,255,0.06)' : 'transparent' }}
                    >
                      {w.isMain && <Star size={8} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
                      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: w.verified ? '#22c55e' : '#71717a' }} />
                      {truncateAddress(w.address)}
                      {i === activeWallet && <Check size={10} className="ml-auto text-[var(--trench-accent)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats strip + bio below the hero row */}
      {stats && stats.totalTrades > 0 && (
        <div className="flex gap-2 mt-4">
          <div className="skew-container glass-inner flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
            <span className="text-[13px] font-bold font-mono text-[var(--trench-accent)]">{stats.winRate.toFixed(0)}%</span>
            <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</span>
          </div>
          <div className="skew-container glass-inner flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
            <span className="text-[13px] font-bold font-mono text-[var(--trench-text)]">{stats.totalTrades}</span>
            <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</span>
          </div>
          {roi !== undefined && (
            <div className="skew-container glass-inner flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
              <span className={`text-[13px] font-bold font-mono ${roi >= 0 ? 'text-[var(--trench-accent)]' : 'text-[var(--trench-red)]'}`}>
                {roi >= 0 ? '+' : ''}{Math.round(roi)}%
              </span>
              <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">ROI</span>
            </div>
          )}
        </div>
      )}

      {bio && (
        <p className="text-[11px] text-[var(--trench-text-muted)] mt-3 leading-snug">{bio}</p>
      )}
    </div>
  );
}
