'use client';

import { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { BorderGlow } from './border-glow';

interface Trader {
  readonly username: string;
  readonly name: string;
  readonly pnl: string;
  readonly winRate: string;
  readonly trades: string;
  readonly recentToken: string;
  readonly recentPnl: string;
  readonly recentBuy: string;
  readonly recentSell: string;
}

interface TraderCarouselProps {
  traders: readonly Trader[];
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
        if (posRef.current >= singleSetWidth) posRef.current -= singleSetWidth;
        el.scrollLeft = posRef.current;
      }
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
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
          className="flex-shrink-0 w-[300px] cursor-pointer"
          backgroundColor="rgba(8,12,18,0.78)"
          glowRadius={20}
          glowIntensity={0.6}
          edgeSensitivity={25}
          fillOpacity={0.2}
        >
          <a
            href={`/${t.username}`}
            className="block relative group"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            {/* Main content */}
            <div className="p-4 pr-[68px]">
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}
                >
                  <img src={`https://unavatar.io/twitter/${t.username}`} alt={t.name} className="w-full h-full object-cover" />
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

              {/* PnL */}
              <div className="text-[18px] font-bold font-mono text-[var(--trench-green)] mb-1">{t.pnl}</div>
              <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px] mb-3">TOTAL PnL</div>

              {/* Recent trade */}
              <div className="cut-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.06)', padding: '8px 10px' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white">{t.recentToken}</span>
                  <span className="text-[11px] font-bold font-mono text-[var(--trench-green)]">{t.recentPnl}</span>
                </div>
                <div className="flex gap-2">
                  <div className="cut-xs flex-1 flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.02)' }}>
                    <span className="text-[var(--trench-green)] font-semibold">BUY</span>
                    <span className="text-[var(--trench-text)] font-semibold">{t.recentBuy} SOL</span>
                  </div>
                  <div className="cut-xs flex-1 flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.02)' }}>
                    <span className="text-[var(--trench-red)] font-semibold">SELL</span>
                    <span className="text-[var(--trench-green)] font-semibold">{t.recentSell} SOL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side — 3 vertical stat pills, smaller */}
            <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
              <div
                className="flex items-center justify-center px-2.5 py-1.5 min-w-[48px]"
                style={{ background: 'rgba(8,12,18,0.92)', border: '1px solid rgba(0,212,255,0.15)', clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
              >
                <div className="text-center">
                  <div className="text-[10px] font-bold font-mono text-[var(--trench-green)]">{t.pnl}</div>
                  <div className="text-[5px] text-[var(--trench-text-muted)] tracking-[1px]">PnL</div>
                </div>
              </div>
              <div
                className="flex items-center justify-center px-2.5 py-1.5 min-w-[48px]"
                style={{ background: 'rgba(8,12,18,0.92)', border: '1px solid rgba(0,212,255,0.15)', clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
              >
                <div className="text-center">
                  <div className="text-[10px] font-bold font-mono text-[var(--trench-accent)]">{t.winRate}</div>
                  <div className="text-[5px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</div>
                </div>
              </div>
              <div
                className="flex items-center justify-center px-2.5 py-1.5 min-w-[48px]"
                style={{ background: 'rgba(8,12,18,0.92)', border: '1px solid rgba(0,212,255,0.15)', clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
              >
                <div className="text-center">
                  <div className="text-[10px] font-bold font-mono text-[var(--trench-text)]">{t.trades}</div>
                  <div className="text-[5px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</div>
                </div>
              </div>
            </div>
          </a>
        </BorderGlow>
      ))}
    </div>
  );
}
