'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CutCorner } from '@/components/cut-corner';
import { CutButton } from '@/components/cut-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from '@/components/glass-card';
import { ExternalLink, CheckCircle2, Circle } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  bannerUrl: string | null;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
}

const ICON_OPTIONS = [
  { key: 'default', label: '🔗 Link' },
  { key: 'twitter', label: '🐦 Twitter' },
  { key: 'twitch', label: '📺 Twitch' },
  { key: 'discord', label: '💬 Discord' },
  { key: 'telegram', label: '💬 Telegram' },
  { key: 'youtube', label: '▶️ YouTube' },
  { key: 'instagram', label: '📸 Instagram' },
  { key: 'github', label: '💻 GitHub' },
  { key: 'game', label: '🎮 Gaming' },
  { key: 'globe', label: '🌐 Website' },
] as const;

export default function DashboardPage() {
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

  return (
    <div className="space-y-8">
      {/* Header nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-[var(--trench-accent)] tracking-wide">
          DASHBOARD
        </h1>
        <div className="flex items-center gap-3 text-xs font-mono">
          <Link href="/dashboard/trades" className="text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
            TRADES
          </Link>
          <Link href="/dashboard/wallets" className="text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
            WALLETS
          </Link>
          {profile?.username && (
            <Link
              href={`/${profile.username}`}
              className="text-[var(--trench-accent)] hover:opacity-80 transition-opacity"
            >
              VIEW PROFILE ↗
            </Link>
          )}
        </div>
      </div>

      {/* Profile Preview */}
      {profile && (
        <GlassCard className="p-5 overflow-hidden" cut={12}>
          {bannerUrl && (
            <div className="w-full h-12 overflow-hidden mb-3 -mt-5 -mx-5" style={{ width: 'calc(100% + 40px)' }}>
              <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-50" />
            </div>
          )}
          <div className="flex items-center gap-3">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-black" style={{ background: accentColor }}>
                {(profile.displayName ?? profile.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold text-[var(--trench-text)] truncate">{profile.displayName ?? profile.username}</p>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: accentColor }} />
              </div>
              <p className="text-xs font-mono text-[var(--trench-text-muted)]">@{profile.username}</p>
            </div>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono tracking-widest transition-colors shrink-0"
              style={{ color: accentColor }}
            >
              VIEW <ExternalLink size={10} />
            </a>
          </div>
        </GlassCard>
      )}

      {/* Setup Checklist */}
      <GlassCard className="p-5" cut={12}>
        <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-3">SETUP</p>
        <div className="space-y-2.5">
          {[
            { label: 'Sign in with X', done: true, href: null },
            { label: 'Link a wallet', done: walletCount > 0, href: '/dashboard/wallets' },
            { label: 'Add a link', done: linkCount > 0, href: '/dashboard' },
            { label: 'Pin a trade', done: pinnedCount > 0, href: '/dashboard/trades' },
          ].map(step => (
            <div key={step.label} className="flex items-center gap-2.5">
              {step.done
                ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                : <Circle size={14} className="text-[var(--trench-text-muted)] shrink-0" />
              }
              <span className={`text-xs font-mono flex-1 ${step.done ? 'text-[var(--trench-text-muted)] line-through' : 'text-[var(--trench-text)]'}`}>
                {step.label}
              </span>
              {!step.done && step.href && (
                <a href={step.href} className="text-[9px] font-mono text-[#00D4FF] tracking-widest hover:text-[#33DDFF]">→</a>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Customize */}
      <GlassCard className="p-5 space-y-4" cut={12}>
        <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">CUSTOMIZE</p>

        {/* Accent Color */}
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

        {/* Banner URL */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-[var(--trench-text-muted)]">Banner Image URL</label>
          <Input
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

      {/* Profile editor */}
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

      {/* Links manager */}
      <CutCorner cut="md" className="w-full">
        <div className="p-5 space-y-4">
          <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
            Links
          </p>

          {/* Existing links */}
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

          {/* Add link form */}
          <div className="space-y-3 pt-2 border-t border-[var(--trench-border)]">
            <p className="text-xs font-mono text-[var(--trench-text-muted)]">Add a link</p>
            <div className="flex gap-2">
              <select
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
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Label"
                className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
              />
            </div>
            <Input
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
    </div>
  );
}
