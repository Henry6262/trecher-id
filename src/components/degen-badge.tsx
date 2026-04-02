'use client';

import { motion } from 'framer-motion';
import {
  Crown, Gem, Scissors, Zap, Anchor, TrendingDown, Activity, Sprout,
  type LucideProps,
} from 'lucide-react';
import type { DegenScoreResult } from '@/lib/degen-score';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Crown, Gem, Scissors, Zap, Anchor, TrendingDown, Activity, Sprout,
};

interface DegenBadgeProps {
  result: DegenScoreResult;
  size?: 'sm' | 'md';
}

const SIZE = {
  sm: { icon: 12, text: '9px', bar: '2px', px: '8px', py: '5px', gap: '5px', track: '52px' },
  md: { icon: 16, text: '11px', bar: '3px', px: '12px', py: '8px', gap: '7px', track: '72px' },
};

export function DegenBadge({ result, size = 'sm' }: DegenBadgeProps) {
  const { archetype, score } = result;
  const s = SIZE[size];
  const Icon = ICON_MAP[archetype.iconName] ?? Activity;
  const glow = archetype.glowColor;

  // cut-corner clip path (6px cut for sm, 8px for md)
  const cut = size === 'sm' ? '6px' : '8px';
  const clip = `polygon(${cut} 0%, 100% 0%, 100% calc(100% - ${cut}), calc(100% - ${cut}) 100%, 0% 100%, 0% ${cut})`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: `${s.py} ${s.px}`,
        clipPath: clip,
        background: 'rgba(8,12,22,0.85)',
        border: `1px solid ${glow}30`,
        boxShadow: `0 0 16px ${glow}20`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Icon size={s.icon} style={{ color: glow, flexShrink: 0 }} strokeWidth={2} />
      <span
        style={{
          fontSize: s.text,
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: glow,
          whiteSpace: 'nowrap',
        }}
      >
        {archetype.key}
      </span>
      {/* Score bar */}
      <div
        style={{
          width: s.track,
          height: s.bar,
          background: 'rgba(255,255,255,0.06)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${score}%`,
            background: glow,
            opacity: 0.8,
          }}
        />
      </div>
    </motion.div>
  );
}
