import { BarChart3, Boxes, CalendarDays, Link2, ShieldCheck, Trophy } from 'lucide-react';
import { GlassCard } from '@/components/glass-card';

interface ProfileNavSection {
  id: string;
  label: string;
  hint: string;
}

interface ProfileSideNavProps {
  accentColor: string;
  rank: number | null;
  totalPnlUsd: number;
  verifiedWallets: number;
  indexedWallets: number;
  sections: ProfileNavSection[];
}

function formatPnl(totalPnlUsd: number) {
  const prefix = totalPnlUsd >= 0 ? '+$' : '-$';
  const abs = Math.abs(totalPnlUsd);

  if (abs >= 1000) {
    return `${prefix}${(abs / 1000).toFixed(1)}K`;
  }

  return `${prefix}${abs.toFixed(0)}`;
}

export function ProfileSideNav({
  accentColor,
  rank,
  totalPnlUsd,
  verifiedWallets,
  indexedWallets,
  sections,
}: ProfileSideNavProps) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <GlassCard className="pt-5 pr-5 pb-5 pl-7" cut={12}>
        <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">PROFILE MAP</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div
            className="cut-sm px-3 py-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}
          >
            <div className="flex items-center gap-2 text-[var(--trench-accent)]">
              <Trophy size={14} />
              <span className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">RANK</span>
            </div>
            <div className="mt-2 text-lg font-black text-white">{rank != null ? `#${rank}` : '—'}</div>
          </div>
          <div
            className="cut-sm px-3 py-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}
          >
            <div className="flex items-center gap-2 text-[var(--trench-accent)]">
              <BarChart3 size={14} />
              <span className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">PNL</span>
            </div>
            <div className="mt-2 text-lg font-black text-white">{formatPnl(totalPnlUsd)}</div>
          </div>
        </div>

        <div
          className="mt-3 cut-sm px-3 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}
        >
          <div className="flex items-center gap-2 text-[var(--trench-accent)]">
            <ShieldCheck size={14} />
            <span className="text-[8px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)]">PROOF</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-white">
            {verifiedWallets}/{indexedWallets} wallets verified
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-[var(--trench-text-muted)]">
            Anchored sections keep the public profile readable while preserving the proof stack.
          </div>
        </div>
      </GlassCard>

      <GlassCard className="pt-5 pr-5 pb-5 pl-7" cut={12} glow={false}>
        <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">SECTIONS</p>
        <div className="mt-3 space-y-1">
          {sections.map((section) => {
            const icon =
              section.id === 'profile-links' ? Link2
              : section.id === 'profile-proof' ? ShieldCheck
              : section.id === 'profile-performance' ? CalendarDays
              : section.id === 'profile-trades' ? Trophy
              : Boxes;

            const Icon = icon;

            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block cut-sm px-3 py-3 transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${accentColor}12` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${accentColor}14`, color: accentColor }}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--trench-text)]">{section.label}</div>
                    <div className="mt-0.5 text-[10px] text-[var(--trench-text-muted)]">{section.hint}</div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
