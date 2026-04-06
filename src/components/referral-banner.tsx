'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import { CutButton } from '@/components/cut-button';
import { Users, Gift, CheckCircle2 } from 'lucide-react';

interface BannerStats {
  validatedCount: number;
  currentBoost: number;
  nextTier: { boost: number; remaining: number } | null;
}

export function ReferralBanner() {
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referral/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          validatedCount: data.validatedCount ?? 0,
          currentBoost: data.currentBoost ?? 0,
          nextTier: data.nextTier ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!stats) return null;

  const isMaxTier = stats.currentBoost >= 20;
  const hasReferrals = stats.validatedCount > 0;

  // Variant C: Max tier
  if (isMaxTier) {
    return (
      <GlassCard className="p-5 relative overflow-hidden" cut={12}>
        <div
          className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-[13px] font-mono font-bold text-[var(--trench-text)]">
                {stats.validatedCount} Referrals — Max Tier!
              </p>
              <p className="text-[11px] font-mono text-[var(--trench-text-muted)]">
                You&apos;re earning the maximum <span className="text-green-400">20%</span> boost
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="px-2.5 py-1 text-[10px] font-mono font-bold text-green-400 rounded shrink-0"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              +20%
            </span>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Variant A: Has referrals, progressing
  if (hasReferrals) {
    return (
      <Link href="/dashboard/referrals" className="block">
        <GlassCard className="p-5 relative overflow-hidden" cut={12}>
          <div
            className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                <Users size={20} className="text-[var(--trench-accent)]" />
              </div>
              <div>
                <p className="text-[13px] font-mono font-bold text-[var(--trench-text)]">
                  {stats.validatedCount} Referral{stats.validatedCount !== 1 ? 's' : ''}
                </p>
                <p className="text-[11px] font-mono text-[var(--trench-text-muted)]">
                  Earning <span className="text-[var(--trench-accent)]">{stats.currentBoost}%</span> boost
                  {stats.nextTier && <> — {stats.nextTier.remaining} more for {stats.nextTier.boost}%</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--trench-accent)] rounded shrink-0"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}
              >
                +{stats.currentBoost}%
              </span>
              <span className="text-[11px] font-mono text-[var(--trench-accent)]">View →</span>
            </div>
          </div>
        </GlassCard>
      </Link>
    );
  }

  // Variant B: No referrals yet
  return (
    <GlassCard className="p-5 relative overflow-hidden" cut={12}>
      <div
        className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)' }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <Gift size={20} className="text-[var(--trench-accent)]" />
          </div>
          <div>
            <p className="text-[13px] font-mono font-bold text-[var(--trench-text)]">
              Earn up to 20% boost
            </p>
            <p className="text-[11px] font-mono text-[var(--trench-text-muted)]">
              Invite friends to unlock reward multipliers
            </p>
          </div>
        </div>
        <CutButton href="/dashboard/referrals" size="sm">Get Link</CutButton>
      </div>
    </GlassCard>
  );
}
