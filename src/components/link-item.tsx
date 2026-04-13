import { ChevronRight, GraduationCap, MessageCircle, DollarSign, Globe, Gamepad2, Link2, Code2, Play, Tv, Camera, type LucideProps } from 'lucide-react';
import { createElement, type FC } from 'react';

const XIcon: FC<LucideProps> = ({ className, size = 18, strokeWidth = 2, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    aria-hidden="true"
    {...props}
  >
    <path d="M4 4L20 20" />
    <path d="M20 4L4 20" />
  </svg>
);

const TikTokIcon: FC<LucideProps> = ({ className, size = 18, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width={size}
    height={size}
    aria-hidden="true"
    {...props}
  >
    <path d="M14.19 3c.28 2.18 1.52 4.05 3.47 5.1 1.03.55 2.18.83 3.34.81v3.1a9.7 9.7 0 0 1-3.45-.63v5.42a6.8 6.8 0 1 1-6.79-6.8c.38 0 .73.03 1.08.09v3.2a3.8 3.8 0 1 0 2.35 3.51V3h3.99Z" />
  </svg>
);

const BlueskyIcon: FC<LucideProps> = ({ className, size = 18, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width={size}
    height={size}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 11.1c1.35-2.57 5.04-6.53 7.98-8.28 2.11-1.25 2.77-.99 2.77-.05 0 1.07-1.24 8.8-1.97 10.08-.25.44-1.18 1.91-3.02 1.58 1.52.26 1.91 1.13 1.91 1.74 0 .68-.38 1.53-.98 2.34-1.06 1.43-2.93 2.36-5.03 2.36-1.68 0-3.05-.6-4.15-1.84-1.1 1.24-2.47 1.84-4.15 1.84-2.1 0-3.97-.93-5.03-2.36-.6-.81-.98-1.66-.98-2.34 0-.61.39-1.48 1.91-1.74-1.84.33-2.77-1.14-3.02-1.58C.47 11.56-.77 3.83-.77 2.76c0-.94.66-1.2 2.77.05C4.96 4.57 8.65 8.53 10 11.1l.46.88.54-.88Z" />
  </svg>
);

const ICONS: Record<string, FC<LucideProps>> = {
  graduation: GraduationCap,
  x: XIcon,
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
  tiktok: TikTokIcon,
  bluesky: BlueskyIcon,
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
  '🎵': 'tiktok',
  '🦋': 'bluesky',
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

const TWITCH_RESERVED_PATHS = new Set([
  'directory',
  'downloads',
  'jobs',
  'login',
  'p',
  'search',
  'settings',
  'store',
  'subscriptions',
  'turbo',
  'videos',
]);

function getTwitchChannel(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)twitch\.tv$/i.test(parsed.hostname)) return null;

    const firstSegment = parsed.pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
    if (!firstSegment || TWITCH_RESERVED_PATHS.has(firstSegment)) return null;
    return firstSegment;
  } catch {
    return null;
  }
}

function getTwitchParentDomains(): string[] {
  const domains = new Set<string>(['localhost', '127.0.0.1']);
  const rawValues = [
    process.env.NEXT_PUBLIC_TWITCH_PARENT,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ].filter(Boolean);

  for (const value of rawValues) {
    try {
      const hostname = value!.includes('://') ? new URL(value!).hostname : value!;
      if (hostname) domains.add(hostname.replace(/:\d+$/, ''));
    } catch {
      // Ignore malformed env values.
    }
  }

  return Array.from(domains);
}

export function LinkItem({ title, url, icon }: LinkItemProps) {
  const twitchChannel = getTwitchChannel(url);
  const isTwitch = twitchChannel !== null;
  const iconColorClass = isTwitch ? 'text-[#9146FF]' : 'text-[var(--trench-accent)]';
  const twitchParents = getTwitchParentDomains();
  const twitchEmbedSrc = twitchChannel
    ? `https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&autoplay=false&${twitchParents.map((parent) => `parent=${encodeURIComponent(parent)}`).join('&')}`
    : null;

  if (twitchChannel && twitchEmbedSrc) {
    return (
      <div
        className="cut-sm border border-[rgba(145,70,255,0.28)] p-2.5"
        style={{ background: 'rgba(8,12,22,0.58)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-3 px-2 pb-1.5 pt-0.5 transition-all group"
        >
          {createElement(resolveIcon(icon), { size: 18, className: `flex-shrink-0 ${iconColorClass}` })}
          <span className="text-[13px] text-[var(--trench-text)] font-medium flex-1">{title}</span>
          <span className="rounded-full border border-[rgba(145,70,255,0.35)] px-2 py-0.5 text-[9px] font-mono tracking-[0.16em] text-[#c8a7ff]">
            LIVE
          </span>
          <ChevronRight size={20} className="text-[var(--trench-text-muted)] flex-shrink-0 transition-colors group-hover:text-[#c8a7ff]" />
        </a>

        <div className="overflow-hidden rounded-[18px] border border-[rgba(145,70,255,0.18)] bg-black">
          <div className="relative aspect-video">
            <iframe
              src={twitchEmbedSrc}
              title={`${title} Twitch stream`}
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>
    );
  }

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
