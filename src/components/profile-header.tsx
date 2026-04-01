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
        padding: '28px 28px 24px',
        background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 100%)',
      }}
    >
      {/* Wallet selector — absolute top-right */}
      {wallets && wallets.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setWalletOpen(!walletOpen)}
            className="cut-xs flex items-center gap-1.5 text-[8px] font-mono text-[var(--trench-text-muted)] px-2 py-1 transition-all hover:text-[var(--trench-accent)]"
            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}
          >
            {wallets[activeWallet]?.isMain && <Star size={7} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
            <span className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: wallets[activeWallet]?.verified ? '#22c55e' : '#71717a' }} />
            {truncateAddress(wallets[activeWallet]?.address || '')}
            <ChevronDown size={9} className={`transition-transform ${walletOpen ? 'rotate-180' : ''}`} />
          </button>

          {walletOpen && wallets.length > 1 && (
            <div
              className="absolute top-full right-0 mt-1 cut-sm z-50"
              style={{ background: 'rgba(8,12,18,0.95)', border: '1px solid rgba(0,212,255,0.12)', minWidth: '180px' }}
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

      {/* Hero layout — avatar left, info right */}
      <div className="flex items-start gap-5">
        {/* Avatar — left side, cut-corner branded */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-[-16px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />
          <div
            className="relative w-[110px] h-[110px] animate-[pulseGlow_3s_ease-in-out_infinite]"
            style={{
              clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.5), rgba(0,212,255,0.15), rgba(0,212,255,0.4))',
              padding: '2px',
            }}
          >
            <div
              className="w-full h-full overflow-hidden"
              style={{
                clipPath: 'polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)',
                background: '#0a0a0f',
              }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={110} height={110} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[40px] font-bold text-black" style={{ background: 'var(--trench-accent)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info — right side */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Name + badge + category — clickable to twitter */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a
              href={`https://x.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[24px] font-black text-white tracking-tight truncate hover:text-[var(--trench-accent)] transition-colors"
            >
              @{username}
            </a>
            {verified && (
              <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0" style={{ background: '#00D4FF' }}>
                <Check size={11} strokeWidth={3} className="text-black" />
              </div>
            )}
            <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold text-[var(--trench-accent)]" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.12)' }}>SOLANA TRADER</span>
          </div>
          <span className="text-[12px] text-[var(--trench-text-muted)]">{displayName}</span>

          {/* Hero PnL — right side under name */}
          {stats && (
            <div className="mt-2">
              <div
                className="font-mono text-[30px] font-black leading-none"
                style={{
                  color: stats.totalPnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
                  textShadow: stats.totalPnlUsd >= 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)',
                }}
              >
                {formatPnlFull(stats.totalPnlUsd)}
              </div>
              <div className="text-[8px] tracking-[2px] text-[var(--trench-text-muted)] mt-1">TOTAL REALIZED PnL</div>
            </div>
          )}

          {/* Bio */}
          {bio && (
            <p className="text-[11px] text-[var(--trench-text-muted)] mt-2 leading-snug">{bio}</p>
          )}
        </div>
      </div>

      {/* Stats strip — red/green/white, bigger labels, stacked layout */}
      {stats && stats.totalTrades > 0 && (
        <div className="flex gap-2 mt-5">
          <div className="cut-xs flex flex-1 flex-col items-center justify-center px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
            <span className={`text-[16px] font-bold font-mono ${stats.winRate >= 50 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>{stats.winRate.toFixed(0)}%</span>
            <span className="text-[9px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-1">WIN RATE</span>
          </div>
          <div className="cut-xs flex flex-1 flex-col items-center justify-center px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
            <span className="text-[16px] font-bold font-mono text-white">{stats.totalTrades}</span>
            <span className="text-[9px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-1">TRADES</span>
          </div>
          {roi !== undefined && (
            <div className="cut-xs flex flex-1 flex-col items-center justify-center px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
              <span className={`text-[16px] font-bold font-mono ${roi >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                {roi >= 0 ? '+' : ''}{Math.round(roi)}%
              </span>
              <span className="text-[9px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-1">ROI</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
