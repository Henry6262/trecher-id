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
      {/* Subtle glow behind avatar */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[200px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

      {/* Avatar — big and centered */}
      <div className="flex justify-center mb-4 relative">
        <div
          className="w-[96px] h-[96px] rounded-full overflow-hidden flex-shrink-0 animate-[pulseGlow_3s_ease-in-out_infinite]"
          style={{
            border: '3px solid rgba(0,212,255,0.4)',
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={96} height={96} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[36px] font-bold text-black" style={{ background: 'var(--trench-accent)' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Name + verified + badges — centered */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h1 className="text-[22px] font-black text-white tracking-tight">@{username}</h1>
          {verified && (
            <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0" style={{ background: '#00D4FF' }}>
              <Check size={11} strokeWidth={3} className="text-black" />
            </div>
          )}
        </div>
        <span className="text-[12px] text-[var(--trench-text-muted)]">{displayName}</span>

        {/* Wallet selector */}
        {wallets && wallets.length > 0 && (
          <div className="flex justify-center mt-2">
            <div className="relative">
              <button
                onClick={() => setWalletOpen(!walletOpen)}
                className="cut-xs flex items-center gap-2 text-[10px] font-mono text-[var(--trench-text-muted)] px-3 py-1.5 transition-all hover:text-[var(--trench-accent)]"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}
              >
                {wallets[activeWallet]?.isMain && <Star size={9} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: wallets[activeWallet]?.verified ? '#22c55e' : '#71717a' }} />
                {truncateAddress(wallets[activeWallet]?.address || '')}
                <ChevronDown size={11} className={`transition-transform ${walletOpen ? 'rotate-180' : ''}`} />
              </button>

              {walletOpen && wallets.length > 1 && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 cut-sm z-50"
                  style={{ background: 'rgba(8,12,18,0.95)', border: '1px solid rgba(0,212,255,0.12)', minWidth: '200px' }}
                >
                  {wallets.map((w, i) => (
                    <button
                      key={w.address}
                      onClick={() => { setActiveWallet(i); setWalletOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-mono transition-all ${
                        i === activeWallet ? 'text-[var(--trench-accent)]' : 'text-[var(--trench-text-muted)] hover:text-[var(--trench-text)]'
                      }`}
                      style={{ background: i === activeWallet ? 'rgba(0,212,255,0.06)' : 'transparent' }}
                    >
                      {w.isMain && <Star size={9} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
                      <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: w.verified ? '#22c55e' : '#71717a' }} />
                      {truncateAddress(w.address)}
                      {i === activeWallet && <Check size={11} className="ml-auto text-[var(--trench-accent)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hero PnL number — big and centered */}
      {stats && (
        <div className="text-center mb-4">
          <div
            className="font-mono text-[32px] font-black leading-none"
            style={{
              color: stats.totalPnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
              textShadow: stats.totalPnlUsd >= 0 ? '0 0 30px rgba(34,197,94,0.25)' : '0 0 30px rgba(239,68,68,0.25)',
            }}
          >
            {formatPnlFull(stats.totalPnlUsd)}
          </div>
          <div className="text-[8px] tracking-[2px] text-[var(--trench-text-muted)] mt-1">TOTAL REALIZED PnL</div>
        </div>
      )}

      {/* Stats strip — centered */}
      {stats && stats.totalTrades > 0 && (
        <div className="flex gap-2 justify-center">
          <div className="skew-container glass-inner flex items-center justify-center gap-1.5 px-3 py-2">
            <span className="text-[14px] font-bold font-mono text-[var(--trench-accent)]">{stats.winRate.toFixed(0)}%</span>
            <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</span>
          </div>
          <div className="skew-container glass-inner flex items-center justify-center gap-1.5 px-3 py-2">
            <span className="text-[14px] font-bold font-mono text-[var(--trench-text)]">{stats.totalTrades}</span>
            <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</span>
          </div>
          {roi !== undefined && (
            <div className="skew-container glass-inner flex items-center justify-center gap-1.5 px-3 py-2">
              <span className={`text-[14px] font-bold font-mono ${roi >= 0 ? 'text-[var(--trench-accent)]' : 'text-[var(--trench-red)]'}`}>
                {roi >= 0 ? '+' : ''}{Math.round(roi)}%
              </span>
              <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">ROI</span>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {bio && (
        <p className="text-[11px] text-[var(--trench-text-muted)] text-center mt-3 leading-snug max-w-[400px] mx-auto">{bio}</p>
      )}
    </div>
  );
}
