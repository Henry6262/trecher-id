'use client';

import React, { useMemo, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

export interface CirclesProps {
  rows?: string[][];
  circleSize?: number;
  baseRadius?: number;
  orbitGap?: number;
  rotationDuration?: number;
  rowDelay?: number;
  direction?: 'clockwise' | 'counterclockwise';
  alternateDirection?: boolean;
  fadeMode?: 'in' | 'out' | 'none';
  fadeBlur?: boolean;
  showPaths?: boolean;
  animate?: boolean;
  animationDuration?: number;
  animationStagger?: number;
  staggerScaleFactor?: number;
  className?: string;
}

const Circles: React.FC<CirclesProps> = ({
  rows = [
    [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    ],
    [
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    ],
    [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    ],
  ],
  circleSize = 64,
  baseRadius = 120,
  orbitGap = 100,
  rotationDuration = 20,
  rowDelay = 0.5,
  direction = 'clockwise',
  alternateDirection = false,
  fadeMode = 'none',
  fadeBlur = false,
  showPaths = true,
  animate = true,
  animationDuration = 0.6,
  animationStagger = 0.15,
  staggerScaleFactor = 0,
  className,
}) => {
  const id = useId().replace(/:/g, '');
  const stableRows = useMemo(() => rows.map(row => [...row]), [rows]);
  const maxRadius = baseRadius + (stableRows.length - 1) * orbitGap;
  const containerSize = (maxRadius + circleSize) * 2;

  const getOpacity = (rowIndex: number) => {
    if (fadeMode === 'in') return 0.2 + (rowIndex / (stableRows.length - 1)) * 0.8;
    if (fadeMode === 'out') return 0.2 + ((stableRows.length - rowIndex - 1) / (stableRows.length - 1)) * 0.8;
    return 1;
  };

  const getBlur = (rowIndex: number) => {
    if (!fadeBlur || fadeMode === 'none') return '0px';
    if (fadeMode === 'in') return `${((stableRows.length - rowIndex - 1) / (stableRows.length - 1)) * 8}px`;
    return `${(rowIndex / (stableRows.length - 1)) * 8}px`;
  };

  // Inject keyframes via a style element — avoids dangerouslySetInnerHTML
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-circles-id', id);

    const kf = [
      `@keyframes cg-fade-in-${id} { 0% { opacity: 0; } 100% { opacity: 1; } }`,
      ...stableRows.map((_, i) => {
        const op = getOpacity(i);
        const bl = getBlur(i);
        return [
          `@keyframes cg-orbit-${id}-${i} {
            from { transform: translate(-50%,-50%) rotate(0deg); }
            to   { transform: translate(-50%,-50%) rotate(360deg); }
          }`,
          `@keyframes cg-counter-${id}-${i} {
            0%   { transform: rotate(var(--ci-neg-angle)) scale(1); opacity:${op}; filter:blur(${bl}); }
            100% { transform: rotate(calc(var(--ci-neg-angle) - 360deg)) scale(1); opacity:${op}; filter:blur(${bl}); }
          }`,
          `@keyframes cg-entrance-${id}-${i} {
            0%   { opacity:0; transform: rotate(var(--ci-neg-angle)) scale(0.6); filter:blur(10px); }
            60%  { filter:blur(${bl}); }
            100% { opacity:${op}; transform: rotate(var(--ci-neg-angle)) scale(1); filter:blur(${bl}); }
          }`,
          `@keyframes cg-path-${id}-${i} {
            0%   { opacity:0; stroke-dashoffset:100; }
            100% { opacity:0.5; stroke-dashoffset:0; }
          }`,
        ].join('\n');
      }),
    ].join('\n');

    styleEl.textContent = kf;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, stableRows.length, fadeMode, fadeBlur]);

  return (
    <div
      className={cn('relative', className)}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        animation: animate ? `cg-fade-in-${id} 0.8s ease-out` : undefined,
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {showPaths && (
          <svg
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{ width: `${containerSize}px`, height: `${containerSize}px`, transform: 'translate(-50%, -50%)' }}
          >
            {stableRows.map((_, rowIndex) => {
              const radius = baseRadius + rowIndex * orbitGap;
              return (
                <circle
                  key={rowIndex}
                  cx="50%"
                  cy="50%"
                  r={radius}
                  fill="none"
                  stroke="rgba(0,212,255,0.15)"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                  style={{
                    animation: animate
                      ? `cg-path-${id}-${rowIndex} ${animationDuration}s ease-out ${rowIndex * animationStagger}s backwards`
                      : undefined,
                  }}
                />
              );
            })}
          </svg>
        )}

        {stableRows.map((row, rowIndex) => {
          const radius = baseRadius + rowIndex * orbitGap;
          const ringDuration = rotationDuration + rowIndex * rowDelay;
          const rowDirection =
            alternateDirection && rowIndex % 2 === 1
              ? direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
              : direction;
          const animDir = rowDirection === 'clockwise' ? 'normal' : 'reverse';

          return (
            <ul
              key={rowIndex}
              className="absolute left-1/2 top-1/2 list-none p-0 m-0 rounded-full"
              style={{
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                transform: 'translate(-50%, -50%)',
                animation: `cg-orbit-${id}-${rowIndex} ${ringDuration}s linear infinite ${animDir}`,
              }}
            >
              {row.map((imageUrl, circleIndex) => {
                const angle = ((360 / row.length) * circleIndex - 90) % 360;
                const scaledSize = circleSize * (1 + rowIndex * staggerScaleFactor);
                const negAngle = `-${angle}deg`;

                return (
                  <li
                    key={circleIndex}
                    className="absolute block left-1/2 top-1/2"
                    style={{
                      width: `${scaledSize}px`,
                      height: `${scaledSize}px`,
                      margin: `-${scaledSize / 2}px`,
                      transform: `rotate(${angle}deg) translateX(${radius}px)`,
                      ['--ci-neg-angle' as string]: negAngle,
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden"
                      style={{
                        border: '2px solid rgba(0,212,255,0.3)',
                        boxShadow: '0 0 12px rgba(0,212,255,0.15)',
                        animation: animate
                          ? `cg-entrance-${id}-${rowIndex} ${animationDuration}s cubic-bezier(0.34,1.56,0.64,1) ${rowIndex * animationStagger}s both, cg-counter-${id}-${rowIndex} ${ringDuration}s linear infinite ${rowIndex * animationStagger}s ${animDir}`
                          : `cg-counter-${id}-${rowIndex} ${ringDuration}s linear infinite ${animDir}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`Orbit ${rowIndex}-${circleIndex}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>
    </div>
  );
};

Circles.displayName = 'Circles';
export default Circles;
