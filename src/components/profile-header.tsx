'use client';

import Image from 'next/image';
import { formatPnl, truncateAddress } from '@/lib/utils';
import { Check, ChevronDown, Star } from 'lucide-react';
import { DegenBadge } from './degen-badge';
import type { DegenScoreResult } from '@/lib/degen-score';
import { useState } from 'react';
import { ProfileStatsTabs } from './profile-stats-tabs';

function ShareButtons({ username, accent }: { username: string; accent: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cardUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${username}/card`;
  const tweetText = encodeURIComponent(`Check out @${username}'s trading profile on Web3Me 👀\n${cardUrl}`);

  return (
    <>
      <button
        onClick={copyLink}
        className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', color: copied ? '#22c55e' : '#71717a' }}
      >
        {copied ? '✓ COPIED' : '🔗 COPY'}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${tweetText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
        style={{ background: `${accent}14`, border: `1px solid ${accent}33`, color: accent }}
      >
        📤 SHARE
      </a>
    </>
  );
}

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
  followerCount?: number | null;
  roi?: number;
  degenScore?: DegenScoreResult;
  isOwner?: boolean;
  accentColor?: string | null;
}

export function ProfileHeader({ avatarUrl, displayName, username, bio, verified, isClaimed, stats, wallets, followerCount, roi, degenScore, isOwner, accentColor }: ProfileHeaderProps) {
  const accent = accentColor || '#00D4FF';
  const [activeWallet, setActiveWallet] = useState(
    () => wallets?.findIndex(w => w.isMain) ?? 0
  );
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <div
      className="relative"
      style={{
        padding: '20px 16px 20px',
        background: `linear-gradient(180deg, ${accent}0d 0%, transparent 100%)`,
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
            className="transition-colors tracking-widest text-[10px]"
            style={{ color: accent }}
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
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        {/* Avatar — left side, cut-corner branded */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-[-16px] pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)` }} />
          <div
            className="relative w-[110px] h-[110px] animate-[pulseGlow_3s_ease-in-out_infinite]"
            style={{
              clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
              background: `linear-gradient(135deg, ${accent}80, ${accent}26, ${accent}66)`,
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
        <div className="flex-1 min-w-0 pt-1 w-full sm:w-auto text-center sm:text-left">
          {/* Row: name+badge left, PnL right */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-3">
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
                  <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0" style={{ background: accent }}>
                    <Check size={11} strokeWidth={3} className="text-black" />
                  </div>
                )}
                {isClaimed && (
                  <span style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)', color: accent, border: `1px solid ${accent}4d`, background: `${accent}14` }} className="inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] tracking-widest ml-2">
                    ✓ VERIFIED
                  </span>
                )}
                <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold" style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}1f` }}>SOLANA TRADER</span>
                {followerCount != null && followerCount > 0 && (
                  <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-mono" style={{ color: '#71717a', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} FOLLOWERS
                  </span>
                )}
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
              <div className="text-right flex-shrink-0 sm:ml-auto">
                <div
                  className="font-mono text-[20px] sm:text-[28px] font-black leading-none"
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

      {/* Share actions */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
        <ShareButtons username={username} accent={accent} />
      </div>

      <ProfileStatsTabs username={username} allTimeStats={stats} accentColor={accent} />

      {/* Edit button — own profiles only */}
      {isOwner && (
        <div className="absolute bottom-4 right-4 z-10">
          <a
            href="/dashboard"
            className="cut-xs flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all"
            style={{
              background: `${accent}0f`,
              border: `1px solid ${accent}26`,
              color: accent,
            }}
          >
            ✏ EDIT
          </a>
        </div>
      )}
    </div>
  );
}
