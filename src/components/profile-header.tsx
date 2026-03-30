'use client';

import Image from 'next/image';
import { formatPnl, truncateAddress } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
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
  wallets?: { address: string; verified: boolean }[];
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
      {/* Top row: wallet selector on the right */}
      {wallets && wallets.length > 0 && (
        <div className="flex justify-end mb-3 relative">
          <button
            onClick={() => setWalletOpen(!walletOpen)}
            className="cut-xs flex items-center gap-1.5 text-[9px] font-mono text-[var(--trench-text-muted)] px-2.5 py-1 transition-all hover:text-[var(--trench-accent)]"
            style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: wallets[activeWallet]?.verified ? '#22c55e' : '#71717a' }} />
            {truncateAddress(wallets[activeWallet]?.address || '')}
            <ChevronDown size={10} className={`transition-transform ${walletOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
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
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: w.verified ? '#22c55e' : '#71717a' }} />
                  {truncateAddress(w.address)}
                  {i === activeWallet && <Check size={10} className="ml-auto text-[var(--trench-accent)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main hero grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'auto 1fr' }}>
        {/* Left: avatar */}
        <div className="flex flex-col items-center">
          <div
            className="w-[88px] h-[88px] rounded-full flex-shrink-0 flex items-center justify-center text-[30px] font-bold text-black overflow-hidden"
            style={{
              background: avatarUrl ? undefined : 'var(--trench-accent)',
              boxShadow: '0 0 40px rgba(0,212,255,0.25)',
              border: '2.5px solid rgba(0,212,255,0.35)',
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={88} height={88} className="w-full h-full object-cover" unoptimized />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Right: name + bio + stats */}
        <div>
          {/* Name with blue checkmark */}
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-bold text-[22px] text-white">@{username}</h1>
            {verified && (
              <div
                className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
                style={{ background: '#00D4FF' }}
              >
                <Check size={12} strokeWidth={3} className="text-black" />
              </div>
            )}
          </div>

          {bio && <p className="text-[11px] text-[var(--trench-text-muted)] mb-3.5 leading-snug">{bio}</p>}

          {stats && stats.totalTrades > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              <div className="cut-xs text-center py-2 px-1 glass-inner">
                <div className={`text-[15px] font-bold font-mono ${stats.totalPnlUsd >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                  {formatPnl(stats.totalPnlUsd)}
                </div>
                <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">PnL</div>
              </div>
              <div className="cut-xs text-center py-2 px-1 glass-inner">
                <div className="text-[15px] font-bold font-mono text-[var(--trench-accent)]">
                  {stats.winRate.toFixed(0)}%
                </div>
                <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</div>
              </div>
              <div className="cut-xs text-center py-2 px-1 glass-inner">
                <div className="text-[15px] font-bold font-mono text-[var(--trench-text)]">
                  {stats.totalTrades}
                </div>
                <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
