import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, Coins, Link2, Palette, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { GlassCard } from '@/components/glass-card';
import { cn } from '@/lib/utils';

type DashboardPanel = 'overview' | 'wallets' | 'trades' | 'referrals' | 'rewards';

interface DashboardAnchor {
  id: string;
  label: string;
  hint: string;
}

interface ReferralSummary {
  validatedCount: number;
  currentBoost: number;
  nextTierRemaining: number | null;
}

interface DashboardSideNavProps {
  activePanel: DashboardPanel;
  completionPercent: number;
  completionLabel: string;
  referralSummary: ReferralSummary | null;
  walletCount: number;
  linkCount: number;
  pinnedCount: number;
  overviewAnchors: DashboardAnchor[];
}

interface NavItem {
  key: DashboardPanel;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  stat: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    label: 'Identity',
    description: 'Progress, customization, and profile editing.',
    href: '/dashboard',
    icon: Sparkles,
    stat: 'Core',
  },
  {
    key: 'wallets',
    label: 'Wallets',
    description: 'Link wallets and check sync integrity.',
    href: '/dashboard?panel=wallets',
    icon: Wallet,
    stat: 'Sync',
  },
  {
    key: 'trades',
    label: 'Trades',
    description: 'Pin your best trades and shape the story.',
    href: '/dashboard?panel=trades',
    icon: BarChart3,
    stat: 'Proof',
  },
  {
    key: 'referrals',
    label: 'Referrals',
    description: 'Grow your boost and invite loop.',
    href: '/dashboard?panel=referrals',
    icon: Link2,
    stat: 'Growth',
  },
  {
    key: 'rewards',
    label: 'Rewards',
    description: 'Claim your share of the vault.',
    href: '/dashboard?panel=rewards',
    icon: Coins,
    stat: 'Vault',
  },
];

export function DashboardSideNav({
  activePanel,
  completionPercent,
  completionLabel,
  referralSummary,
  walletCount,
  linkCount,
  pinnedCount,
  overviewAnchors,
}: DashboardSideNavProps) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 space-y-4">
        <GlassCard className="pt-6 pr-6 pb-6 pl-8" cut={12}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">BUILD STATUS</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{completionPercent}%</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--trench-text-muted)]">
                {completionLabel}
              </p>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{ borderColor: 'rgba(0,212,255,0.18)', background: 'rgba(0,212,255,0.08)' }}
            >
              <ShieldCheck size={18} className="text-[var(--trench-accent)]" />
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPercent}%`,
                background: 'linear-gradient(90deg, rgba(0,212,255,0.55), rgba(0,212,255,1))',
              }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Wallets', value: walletCount },
              { label: 'Links', value: linkCount },
              { label: 'Pins', value: pinnedCount },
            ].map((item) => (
              <div
                key={item.label}
                className="cut-sm px-2 py-2 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}
              >
                <div className="text-sm font-bold text-white">{item.value}</div>
                <div className="mt-1 text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">
                  {item.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="pt-5 pr-4 pb-4 pl-6" cut={12}>
          <div className="mb-2 px-2 pt-1">
            <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">SECTIONS</p>
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activePanel;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'block cut-sm px-3 py-3 transition-colors',
                    isActive ? 'text-white' : 'text-[var(--trench-text-muted)] hover:text-[var(--trench-text)]',
                  )}
                  style={{
                    background: isActive ? 'rgba(0,212,255,0.10)' : 'rgba(255,255,255,0.02)',
                    border: isActive ? '1px solid rgba(0,212,255,0.22)' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: isActive ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.05)' }}
                    >
                      <item.icon size={16} className={isActive ? 'text-[var(--trench-accent)]' : ''} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className="text-[8px] font-mono uppercase tracking-[1.5px] text-[var(--trench-text-muted)]">
                          {item.stat}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--trench-text-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </GlassCard>

        {activePanel === 'overview' && overviewAnchors.length > 0 && (
          <GlassCard className="pt-5 pr-5 pb-5 pl-7" cut={12} glow={false}>
            <div className="mb-2">
              <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">THIS PAGE</p>
            </div>
            <div className="space-y-1">
              {overviewAnchors.map((anchor) => (
                <a
                  key={anchor.id}
                  href={`#${anchor.id}`}
                  className="block cut-sm px-3 py-2 transition-colors hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="text-[11px] font-semibold text-[var(--trench-text)]">{anchor.label}</div>
                  <div className="mt-0.5 text-[10px] text-[var(--trench-text-muted)]">{anchor.hint}</div>
                </a>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard className="pt-5 pr-5 pb-5 pl-7" cut={12} glow={false}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">REFERRAL LOOP</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {referralSummary
                  ? `${referralSummary.validatedCount} validated invites`
                  : 'Referral stats loading'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--trench-text-muted)]">
                {referralSummary
                  ? referralSummary.nextTierRemaining != null
                    ? `${referralSummary.nextTierRemaining} more to unlock the next tier boost.`
                    : 'You are at max boost. Keep the loop hot.'
                  : 'Share your link to grow your profile distribution and boost.'}
              </p>
            </div>
            <Palette size={16} className="mt-1 text-[var(--trench-accent)]" />
          </div>

          <Link
            href="/dashboard?panel=referrals"
            className="mt-4 flex items-center gap-2 text-[10px] font-mono tracking-[1.5px] text-[var(--trench-accent)]"
          >
            OPEN REFERRALS
            <ArrowRight size={12} />
          </Link>

          {referralSummary && (
            <div className="mt-4 flex items-center justify-between text-[10px] font-mono">
              <span className="text-[var(--trench-text-muted)]">CURRENT BOOST</span>
              <span className="text-white">
                {referralSummary.currentBoost > 0 ? `+${referralSummary.currentBoost}%` : 'Not active'}
              </span>
            </div>
          )}
        </GlassCard>
      </div>
    </aside>
  );
}
