'use client';

import { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface Trader {
  username: string;
  name: string;
  pnl: string;
  winRate: string;
  trades: string;
}

interface TraderCarouselProps {
  traders: Trader[];
}

export function TraderCarousel({ traders }: TraderCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  // Duplicate traders for infinite scroll illusion
  const items = [...traders, ...traders, ...traders];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const speed = 0.5; // pixels per frame

    function tick() {
      if (!isPaused && el) {
        posRef.current += speed;
        // Reset when we've scrolled past the first set
        const singleSetWidth = el.scrollWidth / 3;
        if (posRef.current >= singleSetWidth) {
          posRef.current -= singleSetWidth;
        }
        el.scrollLeft = posRef.current;
      }
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPaused]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-hidden no-scrollbar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {items.map((t, i) => (
        <a
          key={`${t.username}-${i}`}
          href={`/${t.username}`}
          className="flex-shrink-0 w-[220px] p-4 transition-all hover:border-[rgba(0,212,255,0.25)] cursor-pointer group"
          style={{
            background: 'rgba(8,12,18,0.8)',
            border: '1px solid rgba(0,212,255,0.08)',
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          }}
        >
          {/* Avatar + name row */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}
            >
              <img
                src={`https://unavatar.io/twitter/${t.username}`}
                alt={t.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold text-white truncate">@{t.username}</span>
                <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#00D4FF' }}>
                  <Check size={8} strokeWidth={3} className="text-black" />
                </div>
              </div>
              <span className="text-[9px] text-[var(--trench-text-muted)]">{t.name}</span>
            </div>
          </div>

          {/* Stats row — skewed */}
          <div className="flex gap-2">
            <div
              className="skew-container flex-1 flex items-center justify-center gap-1 py-1.5 px-2"
              style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(0,212,255,0.06)' }}
            >
              <span className="text-[12px] font-bold font-mono text-[var(--trench-green)]">{t.pnl}</span>
            </div>
            <div
              className="skew-container flex-1 flex items-center justify-center gap-1 py-1.5 px-2"
              style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(0,212,255,0.06)' }}
            >
              <span className="text-[12px] font-bold font-mono text-[var(--trench-accent)]">{t.winRate}</span>
            </div>
            <div
              className="skew-container flex-1 flex items-center justify-center gap-1 py-1.5 px-2"
              style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(0,212,255,0.06)' }}
            >
              <span className="text-[12px] font-bold font-mono text-[var(--trench-text)]">{t.trades}</span>
            </div>
          </div>

          {/* Labels under stats */}
          <div className="flex gap-2 mt-0.5">
            <span className="flex-1 text-center text-[6px] text-[var(--trench-text-muted)] tracking-[1px]">PnL</span>
            <span className="flex-1 text-center text-[6px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</span>
            <span className="flex-1 text-center text-[6px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</span>
          </div>
        </a>
      ))}
    </div>
  );
}
