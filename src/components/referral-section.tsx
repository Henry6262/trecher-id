'use client';

import { CutButton } from '@/components/cut-button';
import { REFERRAL_TIERS } from '@/lib/referral-tiers';

const BAR_HEIGHTS = [30, 50, 70, 90, 110, 130, 160];
const BAR_OPACITIES = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export function ReferralSection() {
  return (
    <section className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16 py-10 sm:py-16">
      {/* Section tag with decorative lines */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <div
          className="h-px flex-1 max-w-[120px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.55) 55%, rgba(0,212,255,0.08) 100%)' }}
        />
        <div className="text-[9px] font-mono tracking-[3px] uppercase" style={{ color: 'rgba(0,212,255,0.75)' }}>
          Referrals
        </div>
        <div
          className="h-px flex-1 max-w-[120px]"
          style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.08) 0%, rgba(0,212,255,0.55) 45%, transparent 100%)' }}
        />
      </div>

      {/* Headline */}
      <div className="text-center mb-8">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-3">
          Invite Friends,<br />Earn <span className="text-[var(--trench-accent)]">More</span>
        </h2>
        <p className="text-[13px] text-[var(--trench-text-muted)] max-w-[400px] mx-auto leading-relaxed">
          Share your referral link. For every friend who joins and connects their X account, you earn a permanent boost on your rewards.
        </p>
      </div>

      {/* Tier Bar Chart */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 mb-8">
        {REFERRAL_TIERS.map((tier, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 sm:w-10 rounded-t"
              style={{
                height: BAR_HEIGHTS[i],
                opacity: BAR_OPACITIES[i],
                background: 'linear-gradient(180deg, var(--trench-accent) 0%, rgba(0,212,255,0.15) 100%)',
                position: 'relative',
              }}
            >
              <span
                className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[var(--trench-accent)] whitespace-nowrap"
              >
                {tier.boost}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--trench-text-muted)] whitespace-nowrap">
              {tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <CutButton href="/dashboard" size="lg">Open Dashboard</CutButton>
        <p className="mt-3 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
          OPEN DASHBOARD &middot; GET YOUR LINK &middot; START EARNING
        </p>
      </div>
    </section>
  );
}
