'use client';

import { BorderGlow } from './border-glow';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Cut corner size in px */
  cut?: number;
  /** Whether to show BorderGlow on hover */
  glow?: boolean;
  /** Override background */
  bg?: string;
}

export function GlassCard({
  children,
  className,
  cut = 10,
  glow = true,
  bg = 'rgba(8, 12, 18, 0.78)',
}: GlassCardProps) {
  const clipPath = `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`;

  if (!glow) {
    return (
      <div
        className={cn('relative', className)}
        style={{
          clipPath,
          background: bg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,212,255,0.1)',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <BorderGlow
      className={className}
      backgroundColor={bg}
      glowColor="190 100 50"
      colors={['#00D4FF', '#33DDFF', '#0099CC']}
      glowRadius={24}
      glowIntensity={0.7}
      coneSpread={25}
      edgeSensitivity={25}
      fillOpacity={0.25}
    >
      <div style={{ clipPath, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: bg }}>
        {children}
      </div>
    </BorderGlow>
  );
}
