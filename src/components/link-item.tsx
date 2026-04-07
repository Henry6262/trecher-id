import { ChevronRight, GraduationCap, MessageCircle, DollarSign, Globe, Gamepad2, Link2, Code2, Play, Tv, Camera, type LucideProps } from 'lucide-react';
import { createElement, type FC } from 'react';

const ICONS: Record<string, FC<LucideProps>> = {
  graduation: GraduationCap,
  x: Globe,         // Twitter/X
  twitter: Globe,
  telegram: MessageCircle,
  discord: MessageCircle,
  dollar: DollarSign,
  globe: Globe,
  game: Gamepad2,
  github: Code2,
  youtube: Play,
  twitch: Tv,
  instagram: Camera,
  default: Link2,
};

// Map legacy emoji icons to string keys
const EMOJI_TO_KEY: Record<string, string> = {
  '🔗': 'default',
  '🐦': 'twitter',
  '📸': 'instagram',
  '💬': 'telegram',
  '🎮': 'game',
  '📺': 'youtube',
  '🎵': 'default',
  '📝': 'default',
  '🌐': 'globe',
  '💼': 'dollar',
};

function resolveIcon(icon: string | null | undefined): FC<LucideProps> {
  if (!icon) return ICONS.default;
  // If it's an emoji, map to key first
  if (EMOJI_TO_KEY[icon]) return ICONS[EMOJI_TO_KEY[icon]] ?? ICONS.default;
  // Otherwise use as key directly
  return ICONS[icon] ?? ICONS.default;
}

interface LinkItemProps {
  title: string;
  url: string;
  icon?: string | null;
}

export function LinkItem({ title, url, icon }: LinkItemProps) {
  // Detect Twitch URLs for potential embed treatment
  const isTwitch = url.includes('twitch.tv/');
  const iconColorClass = isTwitch ? 'text-[#9146FF]' : 'text-[var(--trench-accent)]';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-[18px] py-3.5 cut-sm transition-all border border-[rgba(0,212,255,0.06)] hover:border-[rgba(0,212,255,0.2)] group"
      style={{ background: 'rgba(8,12,22,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {createElement(resolveIcon(icon), { size: 18, className: `flex-shrink-0 ${iconColorClass}` })}
      <span className="text-[13px] text-[var(--trench-text)] font-medium flex-1">{title}</span>
      <ChevronRight size={20} className="text-[var(--trench-text-muted)] flex-shrink-0 transition-colors group-hover:text-[var(--trench-accent)]" />
    </a>
  );
}
