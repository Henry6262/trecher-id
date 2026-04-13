'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CutCorner } from '@/components/cut-corner';
import { CutButton } from '@/components/cut-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from '@/components/glass-card';
import { AvatarImage } from '@/components/avatar-image';
import { WalletsPanel } from '@/components/dashboard/wallets-panel';
import { TradesPanel } from '@/components/dashboard/trades-panel';
import { ReferralsPanel } from '@/components/dashboard/referrals-panel';
import { DashboardSideNav } from '@/components/dashboard/dashboard-side-nav';
import { getPublicAvatarUrl } from '@/lib/images';
import { ArrowRight, CheckCircle2, Circle, Gift, Palette, Sparkles } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  bannerUrl: string | null;
  leaderboardRank: number | null;
  leaderboardUpdatedAt: string | null;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
}

interface ReferralSummary {
  validatedCount: number;
  pendingCount: number;
  currentBoost: number;
  nextTier: { remaining: number } | null;
}

const ICON_OPTIONS = [
  { key: 'default', label: '🔗 Link' },
  { key: 'twitter', label: '🐦 Twitter' },
  { key: 'bluesky', label: '🦋 Bluesky' },
  { key: 'twitch', label: '📺 Twitch' },
  { key: 'discord', label: '💬 Discord' },
  { key: 'telegram', label: '💬 Telegram' },
  { key: 'youtube', label: '▶️ YouTube' },
  { key: 'instagram', label: '📸 Instagram' },
  { key: 'tiktok', label: '🎵 TikTok' },
  { key: 'github', label: '💻 GitHub' },
  { key: 'game', label: '🎮 Gaming' },
  { key: 'globe', label: '🌐 Website' },
] as const;

type DashboardPanel = 'overview' | 'wallets' | 'trades' | 'referrals';

function resolveDashboardPanel(value: string | null): DashboardPanel {
  if (value === 'wallets' || value === 'trades' || value === 'referrals') {
    return value;
  }
  return 'overview';
}

function getDashboardHref(panel: DashboardPanel) {
  return panel === 'overview' ? '/dashboard' : `/dashboard?panel=${panel}`;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activePanel = resolveDashboardPanel(searchParams.get('panel'));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#00D4FF');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('default');
  const [addingLink, setAddingLink] = useState(false);

  const [walletCount, setWalletCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setDisplayName(data.displayName ?? '');
        setBio(data.bio ?? '');
        setAccentColor(data.accentColor ?? '#00D4FF');
        setBannerUrl(data.bannerUrl ?? '');
      })
      .catch(() => {});

    fetch('/api/links')
      .then((r) => r.json())
      .then((data: LinkItem[]) => {
        const arr = Array.isArray(data) ? data : [];
        setLinks(arr);
        setLinkCount(arr.length);
      })
      .catch(() => {});

    fetch('/api/wallets').then(r => r.json()).then(d => setWalletCount(Array.isArray(d) ? d.length : 0)).catch(() => {});

    fetch('/api/trades/pin').then(r => r.json()).then(d => setPinnedCount(Array.isArray(d) ? d.length : 0)).catch(() => {});

    fetch('/api/referral/stats')
      .then((r) => r.json())
      .then((data: ReferralSummary) => setReferralSummary(data))
      .catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, accentColor, bannerUrl }),
      });
      if (res.ok) {
        const updated: Profile = await res.json();
        setProfile(updated);
        setSaveMsg('Saved.');
      } else {
        setSaveMsg('Error saving.');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  }

  async function deleteLink(id: string) {
    await fetch('/api/links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id);
      setLinkCount(next.length);
      return next;
    });
  }

  async function addLink() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setAddingLink(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, url: newUrl, icon: newIcon }),
      });
      if (res.ok) {
        const created: LinkItem = await res.json();
        setLinks((prev) => {
          const next = [...prev, created];
          setLinkCount(next.length);
          return next;
        });
        setNewTitle('');
        setNewUrl('');
        setNewIcon('default');
      }
    } finally {
      setAddingLink(false);
    }
  }

  const panels: { key: DashboardPanel; label: string }[] = [
    { key: 'overview', label: 'PROFILE' },
    { key: 'wallets', label: 'WALLETS' },
    { key: 'trades', label: 'TRADES' },
    { key: 'referrals', label: 'REFERRALS' },
  ];

  const setupItems = [
    { label: 'Sign in with X', done: true, href: null },
    { label: 'Link a wallet', done: walletCount > 0, href: '/dashboard?panel=wallets' },
    { label: 'Add a profile link', done: linkCount > 0, href: '#links' },
    { label: 'Pin a trade', done: pinnedCount > 0, href: '/dashboard?panel=trades' },
    { label: 'Customize your look', done: !!bannerUrl.trim() || accentColor !== '#00D4FF', href: '#customize' },
  ];
  const completedSetupItems = setupItems.filter((item) => item.done).length;
  const completionPercent = Math.round((completedSetupItems / setupItems.length) * 100);
  const completionLabel =
    completionPercent >= 100
      ? 'Your identity stack is fully staged.'
      : completionPercent >= 60
        ? 'The profile is taking shape. Finish the proof and polish layers.'
        : 'Start with proof first, then polish the public-facing profile.';
  const overviewAnchors = [
    { id: 'progress', label: 'Progress', hint: 'Checklist, status, and next move' },
    { id: 'profile', label: 'Profile', hint: 'Preview the public page and core identity' },
    { id: 'customize', label: 'Customize', hint: 'Accent color, banner, and visual direction' },
    { id: 'links', label: 'Links', hint: 'Add the outbound stack for your profile' },
  ];

  return (
    <div className="space-y-8">
      {/* Header nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-[var(--trench-accent)] tracking-wide">
          DASHBOARD
        </h1>
        <div className="flex items-center gap-3 text-xs font-mono">
          {profile?.leaderboardRank != null && (
            <Link
              href="/leaderboard"
              className="text-[var(--trench-accent)] hover:opacity-80 transition-opacity"
            >
              7D RANK #{profile.leaderboardRank}
            </Link>
          )}
          <span className="text-[var(--trench-text-muted)]">PRIVATE BUILD</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 xl:hidden">
        {panels.map((panel) => (
          <CutButton
            key={panel.key}
            href={getDashboardHref(panel.key)}
            size="sm"
            variant={activePanel === panel.key ? 'primary' : 'secondary'}
          >
            {panel.label}
          </CutButton>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_296px]">
        <div className="space-y-6">
          {activePanel === 'overview' && (
            <>
              <section id="progress" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <GlassCard className="p-5" cut={12}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">BUILD YOUR ID</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                        Shape the profile users actually trust.
                      </h2>
                      <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-[var(--trench-text-muted)]">
                        Lock in proof with wallets and trades, then polish the public page with a cleaner look and a sharper outbound stack.
                      </p>
                    </div>
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                      style={{ borderColor: 'rgba(0,212,255,0.18)', background: 'rgba(0,212,255,0.08)' }}
                    >
                      <Sparkles size={18} className="text-[var(--trench-accent)]" />
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${completionPercent}%`,
                        background: 'linear-gradient(90deg, rgba(0,212,255,0.45), rgba(0,212,255,1))',
                      }}
                    />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {setupItems.map((step) => (
                      <div
                        key={step.label}
                        className="flex items-center gap-2.5 cut-sm px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.06)' }}
                      >
                        {step.done
                          ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                          : <Circle size={14} className="text-[var(--trench-text-muted)] shrink-0" />
                        }
                        <span className={`text-xs font-mono flex-1 ${step.done ? 'text-[var(--trench-text-muted)] line-through' : 'text-[var(--trench-text)]'}`}>
                          {step.label}
                        </span>
                        {!step.done && step.href && (
                          <a href={step.href} className="text-[9px] font-mono text-[#00D4FF] tracking-widest hover:text-[#33DDFF]">
                            →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-5" cut={12} glow={false}>
                  <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">REFERRAL MOMENTUM</p>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-black text-white">
                        {referralSummary ? referralSummary.validatedCount : 0}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--trench-text-muted)]">
                        {referralSummary?.nextTier
                          ? `${referralSummary.nextTier.remaining} more to unlock the next boost tier.`
                          : 'Referral growth starts once your link is in circulation.'}
                      </p>
                    </div>
                    <Gift size={18} className="text-[var(--trench-accent)]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[var(--trench-text-muted)]">CURRENT BOOST</span>
                    <span className="text-white">
                      {referralSummary?.currentBoost ? `+${referralSummary.currentBoost}%` : 'Not active'}
                    </span>
                  </div>
                  <Link
                    href="/dashboard?panel=referrals"
                    className="mt-4 flex items-center gap-2 text-[10px] font-mono tracking-[1.5px] text-[var(--trench-accent)]"
                  >
                    OPEN REFERRALS
                    <ArrowRight size={12} />
                  </Link>
                </GlassCard>
              </section>

              <section id="profile">
                {profile && (
                  <GlassCard className="p-5 overflow-hidden" cut={12}>
                    {bannerUrl && (
                      <div className="relative w-full h-12 overflow-hidden mb-3 -mt-5 -mx-5" style={{ width: 'calc(100% + 40px)' }}>
                        <Image src={bannerUrl} alt="" fill className="object-cover opacity-50" unoptimized />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={getPublicAvatarUrl(profile.username, profile.avatarUrl)}
                        alt={profile.displayName ?? profile.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-bold text-[var(--trench-text)] truncate">{profile.displayName ?? profile.username}</p>
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: accentColor }} />
                          {profile.leaderboardRank != null && (
                            <span
                              className="cut-xs px-2 py-0.5 text-[8px] font-mono tracking-[1.5px]"
                              style={{ color: accentColor, background: `${accentColor}14`, border: `1px solid ${accentColor}26` }}
                            >
                              7D #{profile.leaderboardRank}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[var(--trench-text-muted)]">@{profile.username}</p>
                        {profile.leaderboardUpdatedAt && (
                          <p className="mt-1 text-[9px] font-mono text-[var(--trench-text-muted)]">
                            LOCKED FROM {new Date(profile.leaderboardUpdatedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }).toUpperCase()}
                          </p>
                        )}
                      </div>
                      {profile.username && (
                        <Link
                          href={`/${profile.username}`}
                          className="text-[10px] font-mono tracking-widest transition-colors shrink-0"
                          style={{ color: accentColor }}
                        >
                          VIEW PROFILE →
                        </Link>
                      )}
                    </div>
                  </GlassCard>
                )}
              </section>

              <section id="customize" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <GlassCard className="p-5 space-y-4" cut={12}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">CUSTOMIZE</p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--trench-text-muted)]">
                        Keep the profile sharp and readable. Color and banner should support the proof, not distract from it.
                      </p>
                    </div>
                    <Palette size={16} className="text-[var(--trench-accent)]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[var(--trench-text-muted)]">Accent Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#00D4FF', '#FF6B00', '#22c55e', '#a855f7', '#ef4444', '#f59e0b', '#ec4899', '#6366f1'].map(color => (
                        <button
                          key={color}
                          onClick={() => setAccentColor(color)}
                          className="w-8 h-8 transition-all"
                          style={{
                            background: color,
                            clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                            outline: accentColor === color ? '2px solid white' : '2px solid transparent',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[var(--trench-text-muted)]">Banner Image URL</label>
                    <Input
                      aria-label="Banner Image URL"
                      value={bannerUrl}
                      onChange={e => setBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm"
                    />
                    <p className="text-[9px] font-mono text-[var(--trench-text-muted)]">
                      Use any image URL. Recommended: 1200×400px.
                    </p>
                  </div>
                </GlassCard>

                <CutCorner cut="md" className="w-full">
                  <div className="p-5 space-y-4">
                    <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
                      Profile
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-[var(--trench-text-muted)] mb-1">
                          Display Name
                        </label>
                        <Input
                          aria-label="Display Name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-[var(--trench-text-muted)] mb-1">
                          Bio
                        </label>
                        <Textarea
                          aria-label="Bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Short bio..."
                          rows={3}
                          className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm resize-none focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CutButton onClick={saveProfile} disabled={saving} size="sm">
                        {saving ? 'Saving...' : 'Save Profile'}
                      </CutButton>
                      {saveMsg && (
                        <span className="text-xs font-mono text-[var(--trench-text-muted)]">{saveMsg}</span>
                      )}
                    </div>
                  </div>
                </CutCorner>
              </section>

              <section id="links">
                <CutCorner cut="md" className="w-full">
                  <div className="p-5 space-y-4">
                    <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
                      Links
                    </p>

                    {links.length > 0 ? (
                      <div className="space-y-2">
                        {links.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between gap-3 py-2 border-b border-[var(--trench-border)] last:border-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-mono text-[var(--trench-accent)]">{ICON_OPTIONS.find(o => o.key === link.icon)?.label ?? link.icon ?? '🔗'}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-mono text-[var(--trench-text)] truncate">{link.title}</p>
                                <p className="text-xs font-mono text-[var(--trench-text-muted)] truncate">{link.url}</p>
                              </div>
                            </div>
                            <CutButton
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLink(link.id)}
                              className="shrink-0 text-red-400 hover:text-red-300"
                            >
                              Remove
                            </CutButton>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-[var(--trench-text-muted)]">No links yet.</p>
                    )}

                    <div className="space-y-3 pt-2 border-t border-[var(--trench-border)]">
                      <p className="text-xs font-mono text-[var(--trench-text-muted)]">Add a link</p>
                      <div className="flex gap-2">
                        <select
                          aria-label="Link Icon"
                          value={newIcon}
                          onChange={(e) => setNewIcon(e.target.value)}
                          className="px-3 py-2 rounded text-sm font-mono"
                          style={{ background: 'rgba(8,12,22,0.8)', border: '1px solid rgba(0,212,255,0.15)', color: 'var(--trench-text)' }}
                        >
                          {ICON_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>
                        <Input
                          aria-label="Link Label"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Label"
                          className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
                        />
                      </div>
                      <Input
                        aria-label="Link URL"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
                      />
                      <CutButton
                        onClick={addLink}
                        disabled={addingLink || !newTitle.trim() || !newUrl.trim()}
                        size="sm"
                      >
                        {addingLink ? 'Adding...' : '+ Add Link'}
                      </CutButton>
                    </div>
                  </div>
                </CutCorner>
              </section>
            </>
          )}

          {activePanel === 'wallets' && <WalletsPanel embedded />}
          {activePanel === 'trades' && <TradesPanel embedded />}
          {activePanel === 'referrals' && <ReferralsPanel embedded />}
        </div>

        <DashboardSideNav
          activePanel={activePanel}
          completionPercent={completionPercent}
          completionLabel={completionLabel}
          referralSummary={referralSummary
            ? {
                validatedCount: referralSummary.validatedCount,
                currentBoost: referralSummary.currentBoost,
                nextTierRemaining: referralSummary.nextTier?.remaining ?? null,
              }
            : null}
          walletCount={walletCount}
          linkCount={linkCount}
          pinnedCount={pinnedCount}
          overviewAnchors={overviewAnchors}
        />
      </div>
    </div>
  );
}
