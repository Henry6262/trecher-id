'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type CutButtonVariant = 'primary' | 'secondary' | 'ghost';
type CutButtonSize = 'sm' | 'md' | 'lg';

const SIZE: Record<CutButtonSize, { px: string; py: string; text: string; radius: string }> = {
  sm: { px: '12px', py: '6px',  text: 'text-xs',   radius: '4px' },
  md: { px: '20px', py: '10px', text: 'text-sm',   radius: '6px' },
  lg: { px: '28px', py: '14px', text: 'text-base', radius: '6px' },
};

const VARIANT: Record<CutButtonVariant, { border: string; bg: string; text: string }> = {
  primary:   { border: 'var(--trench-accent)',         bg: 'var(--trench-accent)',           text: 'text-black font-bold' },
  secondary: { border: 'var(--trench-border)',          bg: 'var(--trench-surface-elevated)', text: 'text-[var(--trench-text)]' },
  ghost:     { border: 'transparent',                   bg: 'transparent',                    text: 'text-[var(--trench-text-muted)]' },
};

interface BaseCutButtonProps {
  children: ReactNode;
  variant?: CutButtonVariant;
  size?: CutButtonSize;
  className?: string;
  disabled?: boolean;
}

type CutButtonProps =
  | (BaseCutButtonProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'>)
  | (BaseCutButtonProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'disabled'>);

export function CutButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  href,
  ...rest
}: CutButtonProps) {
  const s = SIZE[size];
  const v = VARIANT[variant];

  const wrapStyle: React.CSSProperties = {
    borderRadius: s.radius,
    border: `1px solid ${v.border}`,
    background: v.bg,
    padding: `${s.py} ${s.px}`,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  };

  const outer = cn(
    'relative inline-block cursor-pointer transition-all active:scale-[0.97] hover:opacity-90',
    disabled && 'opacity-50 pointer-events-none',
    className,
  );

  const inner = (
    <div style={wrapStyle}>
      {variant !== 'ghost' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: s.radius, '--cut-button-rail-color': 'var(--trench-accent)' } as React.CSSProperties}
        >
          <span className="cut-button-rail cut-button-rail-top" />
          <span className="cut-button-rail cut-button-rail-bottom" />
          <span className="cut-button-rail cut-button-rail-left" />
          <span className="cut-button-rail cut-button-rail-right" />
        </div>
      )}
      <span className={cn('flex items-center gap-2 font-mono font-semibold leading-none whitespace-nowrap', s.text, v.text)}>
        {children}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={outer} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </Link>
    );
  }

  return (
    <button disabled={disabled} className={outer} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
