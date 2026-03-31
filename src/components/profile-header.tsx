'use client';

import Image from 'next/image';
import { formatPnl, truncateAddress } from '@/lib/utils';
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
}

export function ProfileHeader({ avatarUrl, displayName, username, bio, verified, stats, wallets }: ProfileHeaderProps) {
  const [activeWallet, setActiveWallet] = useState(0);
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <div
      className="p-6"
      style={{
        background: 'linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 100%)',
      }}
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: 'auto 1fr' }}>
        {/* Left: avatar */}
        <div className="flex flex-col items-center">
          <div
            className="w-[80px] h-[80px] rounded-full flex-shrink-0 flex items-center justify-center text-[28px] font-bold text-black overflow-hidden"
            style={{
              background: avatarUrl ? undefined : 'var(--trench-accent)',
              boxShadow: '0 0 40px rgba(0,212,255,0.25)',
              border: '2.5px solid rgba(0,212,255,0.35)',
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={80} height={80} className="w-full h-full object-cover" unoptimized />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Right: name + wallet selector + bio + stats */}
        <div>
          {/* Row 1: name + checkmark + wallet selector */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-bold text-[20px] text-white">@{username}</h1>
            {verified && (
              <div
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0"
                style={{ background: '#00D4FF' }}
              >
                <Check size={11} strokeWidth={3} className="text-black" />
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Wallet selector — right side of name row */}
            {wallets && wallets.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setWalletOpen(!walletOpen)}
                  className="cut-xs flex items-center gap-2 text-[10px] font-mono text-[var(--trench-text-muted)] px-3 py-1.5 transition-all hover:text-[var(--trench-accent)] hover:border-[rgba(0,212,255,0.2)]"
                  style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}
                >
                  {wallets[activeWallet]?.isMain && <Star size={9} className="text-[var(--trench-accent)] fill-[var(--trench-accent)]" />}
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: wallets[activeWallet]?.verified ? '#22c55e' : '#71717a' }} />
                  {truncateAddress(wallets[activeWallet]?.address || '')}
                  <ChevronDown size={11} className={`transition-transform ${walletOpen ? 'rotate-180' : ''}`} />
                </button>

                {walletOpen && wallets.length > 1 && (
                  <div
                    className="absolute top-full right-0 mt-1 cut-sm z-50"
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
            )}
          </div>

          {/* Bio */}
          {bio && <p className="text-[11px] text-[var(--trench-text-muted)] mb-3 leading-snug">{bio}</p>}

          {/* Stats — skewed / lean / containers */}
          {stats && stats.totalTrades > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="skew-container glass-inner flex items-center gap-2 px-3 py-1.5"
              >
                <span className={`text-[13px] font-bold font-mono ${stats.totalPnlUsd >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                  {formatPnl(stats.totalPnlUsd)}
                </span>
                <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px] uppercase">PnL</span>
              </div>
              <div
                className="skew-container glass-inner flex items-center gap-2 px-3 py-1.5"
              >
                <span className="text-[13px] font-bold font-mono text-[var(--trench-accent)]">
                  {stats.winRate.toFixed(0)}%
                </span>
                <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px] uppercase">Win</span>
              </div>
              <div
                className="skew-container glass-inner flex items-center gap-2 px-3 py-1.5"
              >
                <span className="text-[13px] font-bold font-mono text-[var(--trench-text)]">
                  {stats.totalTrades}
                </span>
                <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px] uppercase">Trades</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
