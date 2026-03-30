'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import { CutButton } from '@/components/cut-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
}

const ICON_OPTIONS = ['🔗', '🐦', '📸', '💬', '🎮', '📺', '🎵', '📝', '🌐', '💼'];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('🔗');
  const [addingLink, setAddingLink] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setBio(data.bio ?? '');
      })
      .catch(() => {});

    fetch('/api/links')
      .then((r) => r.json())
      .then((data: LinkItem[]) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
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
    setLinks((prev) => prev.filter((l) => l.id !== id));
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
        setLinks((prev) => [...prev, created]);
        setNewTitle('');
        setNewUrl('');
        setNewIcon('🔗');
      }
    } finally {
      setAddingLink(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* View profile link */}
      {profile?.username && (
        <div className="flex justify-end">
          <Link
            href={`/${profile.username}`}
            className="cut-xs px-3 py-1 text-[10px] font-mono tracking-[1px] text-[var(--trench-accent)] border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.06)] transition-colors"
          >
            VIEW PROFILE
          </Link>
        </div>
      )}

      {/* Profile editor */}
      <GlassCard cut={10}>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            {profile?.avatarUrl && (
              <div className="h-14 w-14 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' }}>
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName ?? ''}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono text-[var(--trench-text-muted)] tracking-[2px] uppercase mb-1">Profile</p>
              <p className="text-sm font-bold text-white">{profile?.displayName}</p>
              <p className="text-[10px] font-mono text-[var(--trench-text-muted)]">@{profile?.username}</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[var(--trench-text-muted)] tracking-[1px] mb-1">
              BIO
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio..."
              rows={3}
              className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm resize-none focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
            />
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
      </GlassCard>

      {/* Links manager */}
      <GlassCard cut={10}>
        <div className="p-5 space-y-4">
          <p className="text-[10px] font-mono text-[var(--trench-text-muted)] tracking-[2px] uppercase">
            Links
          </p>

          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-[rgba(0,212,255,0.06)] last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none">{link.icon ?? '🔗'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-[var(--trench-text)] truncate">{link.title}</p>
                      <p className="text-[10px] font-mono text-[var(--trench-text-muted)] truncate">{link.url}</p>
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
            <p className="text-[10px] font-mono text-[var(--trench-text-muted)]">No links yet.</p>
          )}

          <div className="space-y-3 pt-2 border-t border-[rgba(0,212,255,0.06)]">
            <p className="text-[10px] font-mono text-[var(--trench-text-muted)]">Add a link</p>
            <div className="flex gap-2">
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="bg-[var(--trench-surface-elevated)] border border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm px-2 py-1 cut-xs focus:outline-none focus:ring-1 focus:ring-[var(--trench-accent)]"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
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
      </GlassCard>
    </div>
  );
}
