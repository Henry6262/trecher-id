'use client';

import { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { BorderGlow } from './border-glow';

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

  const items = [...traders, ...traders, ...traders];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const speed = 0.5;

    function tick() {
      if (!isPaused && el) {
        posRef.current += speed;
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
      className="flex gap-4 overflow-x-hidden no-scrollbar py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {items.map((t, i) => (
        <BorderGlow
          key={`${t.username}-${i}`}
          className="flex-shrink-0 w-[260px] cursor-pointer"
          backgroundColor="rgba(8,12,18,0.78)"
          glowRadius={20}
          glowIntensity={0.6}
          edgeSensitivity={25}
          fillOpacity={0.2}
        >
        <a
          href={`/${t.username}`}
          className="block relative group"
          style={{
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          }}
        >
          {/* Main content — left side */}
          <div className="p-4 pr-[72px]">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-2">
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

            {/* PnL highlight */}
            <div className="text-[18px] font-bold font-mono text-[var(--trench-green)]">{t.pnl}</div>
            <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1px]">TOTAL PnL</div>
          </div>

          {/* Right side — vertical stat pills, half in half out */}
          <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <div
              className="flex items-center justify-center px-3 py-2 min-w-[56px]"
              style={{
                background: 'rgba(8,12,18,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,212,255,0.15)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
            >
              <div className="text-center">
                <div className="text-[12px] font-bold font-mono text-[var(--trench-accent)]">{t.winRate}</div>
                <div className="text-[6px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</div>
              </div>
            </div>
            <div
              className="flex items-center justify-center px-3 py-2 min-w-[56px]"
              style={{
                background: 'rgba(8,12,18,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,212,255,0.15)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
            >
              <div className="text-center">
                <div className="text-[12px] font-bold font-mono text-[var(--trench-text)]">{t.trades}</div>
                <div className="text-[6px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</div>
              </div>
            </div>
          </div>
        </a>
        </BorderGlow>
      ))}
    </div>
  );
}
