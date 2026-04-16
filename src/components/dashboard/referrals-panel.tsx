'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import { CutCorner } from '@/components/cut-corner';
import { CutButton } from '@/components/cut-button';
import { AvatarImage } from '@/components/avatar-image';
import { REFERRAL_TIERS } from '@/lib/referral-tiers';
import { getPublicAvatarUrl } from '@/lib/images';
import { Copy, Check, Users, TrendingUp, Gift } from 'lucide-react';

interface ReferralStats {
  referralCode: string;
  validatedCount: number;
  pendingCount: number;
  currentBoost: number;
  currentTier: { min: number; max: number | null; boost: number } | null;
  nextTier: { min: number; max: number | null; boost: number; remaining: number } | null;
  recentReferrals: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    validatedAt: string;
  }[];
}

export function ReferralsPanel({ embedded = false }: { embedded?: boolean }) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referral/stats')
      .then((r) => r.json())
      .then((data: ReferralStats) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!stats) return;
    const url = `${window.location.origin}/?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const progressPercent = stats?.currentTier && stats.nextTier
    ? ((stats.validatedCount - stats.currentTier.min) / (stats.nextTier.min - stats.currentTier.min)) * 100
    : stats?.validatedCount && !stats.nextTier
      ? 100
      : 0;

  return (
    <div className="space-y-8">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono font-bold text-[var(--trench-accent)] tracking-wide">
            REFERRALS
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono">
            <Link href="/dashboard" className="text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
              DASHBOARD
            </Link>
            <Link href="/dashboard?panel=trades" className="text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
              TRADES
            </Link>
            <Link href="/dashboard?panel=wallets" className="text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
              WALLETS
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm font-mono text-[var(--trench-text-muted)] text-center py-12">Loading...</div>
      ) : !stats ? (
        <div className="text-sm font-mono text-red-400 text-center py-12">Failed to load referral data.</div>
      ) : (
        <>
          <GlassCard className="pt-6 pr-6 pb-6 pl-8" cut={12}>
            <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-3">YOUR REFERRAL LINK</p>
            <div className="flex items-center gap-3">
              <div
                className="flex-1 min-w-0 px-3 py-2.5 rounded font-mono text-sm text-[var(--trench-text)] truncate"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.1)' }}
              >
                {window.location.origin}/?ref={stats.referralCode}
              </div>
              <CutButton onClick={copyLink} size="sm">
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </CutButton>
            </div>
          </GlassCard>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'INVITED', value: String(stats.validatedCount), icon: Users },
              { label: 'PENDING', value: String(stats.pendingCount), icon: TrendingUp },
              { label: 'BOOST', value: stats.currentBoost > 0 ? `${stats.currentBoost}%` : '—', icon: Gift },
            ].map((stat) => (
              <GlassCard key={stat.label} className="pt-5 pr-5 pb-5 pl-6 text-center" cut={8} glow={false}>
                <stat.icon size={16} className="mx-auto mb-1.5 text-[var(--trench-accent)]" />
                <p className="text-lg font-mono font-bold text-[var(--trench-text)]">{stat.value}</p>
                <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">{stat.label}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="pt-6 pr-6 pb-6 pl-8" cut={12}>
            <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-4">TIER PROGRESS</p>

            {stats.nextTier ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[var(--trench-text)]">
                      {stats.currentTier ? `${stats.currentTier.boost}% boost` : 'No boost yet'}
                    </span>
                    <span className="text-[var(--trench-accent)]">{stats.nextTier.boost}% boost</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(progressPercent, 100)}%`,
                        background: 'var(--trench-accent)',
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs font-mono text-[var(--trench-text-muted)]">
                  <span className="text-[var(--trench-accent)]">{stats.nextTier.remaining}</span> more invite{stats.nextTier.remaining !== 1 ? 's' : ''} to unlock{' '}
                  <span className="text-[var(--trench-accent)]">{stats.nextTier.boost}%</span> boost
                </p>
              </>
            ) : stats.validatedCount > 0 ? (
              <p className="text-xs font-mono text-green-400">Max tier reached — 20% boost active</p>
            ) : (
              <p className="text-xs font-mono text-[var(--trench-text-muted)]">Invite your first friend to start earning boosts</p>
            )}

            <div className="mt-5 space-y-1.5">
              {REFERRAL_TIERS.map((tier, index) => {
                const isActive = stats.currentTier?.boost === tier.boost;
                const isReached = stats.validatedCount >= tier.min;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded text-xs font-mono transition-colors"
                    style={{
                      background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--trench-accent)' : '2px solid transparent',
                    }}
                  >
                    <span className={isReached ? 'text-[var(--trench-text)]' : 'text-[var(--trench-text-muted)]'}>
                      {tier.min === tier.max ? `${tier.min}` : tier.max === Infinity ? `${tier.min}+` : `${tier.min}–${tier.max}`} invites
                    </span>
                    <span className={isActive ? 'text-[var(--trench-accent)] font-bold' : isReached ? 'text-[var(--trench-text)]' : 'text-[var(--trench-text-muted)]'}>
                      +{tier.boost}%
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <CutCorner cut="md" className="w-full">
            <div className="pt-6 pr-6 pb-6 pl-8 space-y-3">
              <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">RECENT REFERRALS</p>
              {stats.recentReferrals.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentReferrals.map((ref) => (
                    <div key={ref.username} className="flex items-center gap-3 py-2 border-b border-[var(--trench-border)] last:border-0">
                      <AvatarImage
                        src={getPublicAvatarUrl(ref.username, ref.avatarUrl)}
                        alt={ref.displayName}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-[var(--trench-text)] truncate">
                          {ref.displayName}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--trench-text-muted)]">@{ref.username}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--trench-text-muted)] shrink-0">
                        {new Date(ref.validatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-[var(--trench-text-muted)] py-4 text-center">
                  No referrals yet. Share your link to get started!
                </p>
              )}
            </div>
          </CutCorner>
        </>
      )}
    </div>
  );
}
