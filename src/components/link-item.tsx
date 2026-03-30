import { ChevronRight, GraduationCap, MessageCircle, DollarSign, Globe, Gamepad2, Link2, Code2, Play } from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  graduation: GraduationCap,
  x: Globe,
  telegram: MessageCircle,
  dollar: DollarSign,
  globe: Globe,
  game: Gamepad2,
  github: Code2,
  youtube: Play,
  default: Link2,
};

interface LinkItemProps {
  title: string;
  url: string;
  icon?: string | null;
}

export function LinkItem({ title, url, icon }: LinkItemProps) {
  const IconComponent = ICONS[icon ?? 'default'] ?? ICONS.default;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-[18px] py-3.5 rounded-md transition-all backdrop-blur-md border border-[rgba(0,212,255,0.08)] hover:bg-[rgba(0,212,255,0.06)] hover:border-[rgba(0,212,255,0.2)] group"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <IconComponent size={18} className="text-[var(--trench-accent)] flex-shrink-0" />
      <span className="text-[13px] text-[var(--trench-text)] font-medium flex-1">{title}</span>
      <ChevronRight size={20} className="text-[var(--trench-text-muted)] flex-shrink-0 transition-colors group-hover:text-[var(--trench-accent)]" />
    </a>
  );
}
