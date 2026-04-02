'use client';

import Image from 'next/image';
import { formatPnl, truncateAddress } from '@/lib/utils';
import { Check, ChevronDown, Star } from 'lucide-react';
import { DegenBadge } from './degen-badge';
import type { DegenScoreResult } from '@/lib/degen-score';
import { useState } from 'react';
import { ProfileStatsTabs } from './profile-stats-tabs';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  username: string;
  bio?: string | null;
  verified?: boolean;
  isClaimed?: boolean;
  stats?: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  wallets?: { address: string; verified: boolean; isMain?: boolean }[];
  roi?: number;
  degenScore?: DegenScoreResult;
  isOwner?: boolean;
}

export function ProfileHeader({ avatarUrl, displayName, username, bio, verified, isClaimed, stats, wallets, roi, degenScore, isOwner }: ProfileHeaderProps) {
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
      {/* Claim banner — unclaimed profiles only */}
      {!isClaimed && (
        <div
          className="flex items-center justify-between px-7 py-3 text-xs font-mono"
          style={{
            background: 'rgba(0,212,255,0.04)',
            borderBottom: '1px solid rgba(0,212,255,0.08)',
          }}
        >
          <span className="text-[var(--trench-text-muted)]">
            👋 <span className="text-[var(--trench-text)]">@{username}</span>? This profile was created for you.
          </span>
          <a
            href="/login"
            className="text-[#00D4FF] hover:text-[#33DDFF] transition-colors tracking-widest text-[10px]"
          >
            CLAIM IT →
          </a>
        </div>
      )}

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
          {/* Row: name+badge left, PnL right */}
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* Name + badge + category */}
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
                {isClaimed && (
                  <span style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }} className="inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-[#00D4FF] border border-[#00D4FF]/30 bg-[#00D4FF]/[0.08] ml-2">
                    ✓ VERIFIED
                  </span>
                )}
                <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold text-[var(--trench-accent)]" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.12)' }}>SOLANA TRADER</span>
              </div>

              {/* Degen Badge */}
              {degenScore && (
                <div className="mt-2">
                  <DegenBadge result={degenScore} size="sm" />
                </div>
              )}

              {/* Bio */}
              {bio && (
                <p className="text-[11px] text-[var(--trench-text-muted)] mt-1 leading-snug max-w-[240px]">{bio}</p>
              )}
            </div>

            {/* PnL — far right */}
            {stats && (
              <div className="text-right flex-shrink-0">
                <div
                  className="font-mono text-[28px] font-black leading-none"
                  style={{
                    color: stats.totalPnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)',
                    textShadow: stats.totalPnlUsd >= 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)',
                  }}
                >
                  {formatPnl(stats.totalPnlUsd)}
                </div>
                <div className="text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mt-1">PnL</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileStatsTabs username={username} allTimeStats={stats} />

      {/* Edit button — own profiles only */}
      {isOwner && (
        <div className="absolute bottom-4 right-4 z-10">
          <a
            href="/dashboard"
            className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all hover:text-[#00D4FF]"
            style={{
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.15)',
              color: '#00D4FF',
            }}
          >
            ✏ EDIT
          </a>
        </div>
      )}
    </div>
  );
}
