'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { GlassCard } from './glass-card';

interface TradeData {
  readonly tokenSymbol: string;
  readonly tokenImageUrl?: string | null;
  readonly pnlPercent: string;
  readonly buy?: string | null;
  readonly sell?: string | null;
}

interface Trader {
  readonly username: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly pnl: string;
  readonly winRate: string;
  readonly trades: string;
  readonly topTrades?: readonly TradeData[];
  readonly recentToken?: string | null;
  readonly recentTokenImage?: string | null;
  readonly recentPnl?: string | null;
  readonly recentBuy?: string | null;
  readonly recentSell?: string | null;
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
    <div className="relative mx-auto max-w-[900px] overflow-hidden">
      {/* Fade overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-36 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #050508 20%, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-36 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #050508 20%, transparent)' }} />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden no-scrollbar py-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
      {items.map((t, i) => (
        <Link
          key={`${t.username}-${i}`}
          href={`/${t.username}`}
          className="flex-shrink-0 w-[300px] cursor-pointer block"
        >
          <GlassCard cut={10} bg="rgba(8,12,18,0.85)">
            <div className="p-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}
                >
                  <Image
                    src={t.avatarUrl || `https://unavatar.io/twitter/${t.username}`}
                    alt={t.name}
                    width={44}
                    height={44}
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

              {/* Stats row */}
              <div className="flex gap-2 mb-3">
                <div className="skew-container glass-inner flex flex-1 items-center gap-1.5 px-2.5 py-1.5 cut-xs">
                  <span className="font-mono text-[12px] font-bold text-[var(--trench-green)]">{t.pnl}</span>
                  <span className="text-[7px] tracking-[1px] text-[var(--trench-text-muted)]">PnL</span>
                </div>
                <div className="skew-container glass-inner flex flex-1 items-center gap-1.5 px-2.5 py-1.5 cut-xs">
                  <span className="font-mono text-[12px] font-bold text-[var(--trench-accent)]">{t.winRate}</span>
                  <span className="text-[7px] tracking-[1px] text-[var(--trench-text-muted)]">Win</span>
                </div>
              </div>

              {/* Top trades — show up to 3 winning trades */}
              {t.topTrades && t.topTrades.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {t.topTrades.map((trade, ti) => (
                    <div key={ti} className="cut-xs flex items-center justify-between px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#111', border: '1px solid rgba(0,212,255,0.15)' }}>
                          {trade.tokenImageUrl ? (
                            <Image src={trade.tokenImageUrl} alt={trade.tokenSymbol} width={20} height={20} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-[var(--trench-accent)]">
                              {trade.tokenSymbol.replace('$', '').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-white">{trade.tokenSymbol}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[var(--trench-green)]">{trade.pnlPercent}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </Link>
      ))}
      </div>
    </div>
  );
}
