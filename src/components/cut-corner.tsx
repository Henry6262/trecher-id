import { cn } from '@/lib/utils';
import type { ReactNode, CSSProperties } from 'react';

export type CutSize = 'xs' | 'sm' | 'md' | 'lg';

const CUT_PX: Record<CutSize, string> = {
  xs: '4px',
  sm: '7px',
  md: '12px',
  lg: '18px',
};

function clipPath(cut: string) {
  return `polygon(${cut} 0%, 100% 0%, 100% calc(100% - ${cut}), calc(100% - ${cut}) 100%, 0% 100%, 0% ${cut})`;
}

interface CutCornerProps {
  children: ReactNode;
  className?: string;
  cut?: CutSize;
  borderWidth?: number;
  borderColor?: string;
  bg?: string;
  blur?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

export function CutCorner({
  children,
  className,
  cut = 'md',
  borderWidth = 1,
  borderColor = 'rgba(0,212,255,0.12)',
  bg = 'rgba(8,12,18,0.75)',
  blur = false,
  style,
  onClick,
}: CutCornerProps) {
  const cutVal = CUT_PX[cut];
  const clip = clipPath(cutVal);

  return (
    <div className={cn('relative', className)} style={style} onClick={onClick}>
      {/* Border shape layer — clipped */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: clip, background: borderColor }}
      />
      {/* Blur layer — NOT clipped, sits behind content */}
      {blur && (
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            inset: borderWidth,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: bg,
          }}
        />
      )}
      {/* Fill layer — clipped for shape, no blur */}
      {!blur && (
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            inset: borderWidth,
            clipPath: clip,
            background: bg,
          }}
        />
      )}
      {/* Content — above everything */}
      <div
        className="relative"
        style={{
          padding: borderWidth,
          clipPath: clip,
          zIndex: 1,
        }}
      >
        <div style={{ margin: borderWidth }}>
          {children}
        </div>
      </div>
    </div>
  );
}
