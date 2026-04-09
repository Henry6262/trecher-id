'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { BorderGlow } from './border-glow';
import { AvatarImage } from './avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';

interface Trader {
  readonly username: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly pnl: string;
  readonly winRate: string;
  readonly trades: string;
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
  const pausedRef = useRef(false);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  const items = [...traders, ...traders, ...traders];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const speed = 0.5;
    function tick() {
      if (!pausedRef.current && el) {
        posRef.current += speed;
        const singleSetWidth = el.scrollWidth / 3;
        if (posRef.current >= singleSetWidth) posRef.current -= singleSetWidth;
        el.scrollLeft = posRef.current;
      }
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="relative mx-auto max-w-[900px] overflow-hidden">
      {/* Fade overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-36 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #050508 20%, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-36 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #050508 20%, transparent)' }} />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden no-scrollbar py-2"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {items.map((t, i) => (
          <BorderGlow
            key={`${t.username}-${i}`}
            className="flex-shrink-0 w-[360px] cursor-pointer"
            backgroundColor="rgba(8,12,18,0.78)"
            glowRadius={20}
            glowIntensity={0.6}
            edgeSensitivity={25}
            fillOpacity={0.2}
          >
            <Link
              href={`/${t.username}`}
              className="block relative group"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {/* Top section — padded right to clear the PnL pill */}
              <div className="p-4 pr-[76px]">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}
                  >
                    <AvatarImage
                      src={getPublicAvatarUrl(t.username, t.avatarUrl)}
                      alt={t.name}
                      width={48}
                      height={48}
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

                {/* Win Rate + Trades — side by side, value then label */}
                <div className="flex gap-2">
                  <div
                    className="flex-1 flex items-center justify-between px-2.5 py-1.5"
                    style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                  >
                    <span className="text-[12px] font-bold font-mono text-[var(--trench-accent)]">{t.winRate}</span>
                    <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</span>
                  </div>
                  <div
                    className="flex-1 flex items-center justify-between px-2.5 py-1.5"
                    style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                  >
                    <span className="text-[12px] font-bold font-mono text-[var(--trench-text)]">{t.trades}</span>
                    <span className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</span>
                  </div>
                </div>
              </div>

              {/* Recent trade — full card width */}
              {t.recentToken && (
                <div className="px-4 pb-4">
                  <div className="cut-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.06)', padding: '8px 10px' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(0,212,255,0.15)', background: '#111' }}>
                        {t.recentTokenImage ? (
                          <Image src={t.recentTokenImage} alt={t.recentToken} width={24} height={24} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[var(--trench-accent)]">
                            {t.recentToken.replace('$', '').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white flex-1">{t.recentToken}</span>
                      <span className="text-[11px] font-bold font-mono text-[var(--trench-green)]">{t.recentPnl}</span>
                    </div>
                    <div className="flex gap-2">
                      {t.recentBuy && (
                        <div className="cut-xs flex-1 flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.02)' }}>
                          <span className="text-[var(--trench-green)] font-semibold">BUY</span>
                          <span className="text-[var(--trench-text)] font-semibold">{t.recentBuy} SOL</span>
                        </div>
                      )}
                      {t.recentSell && (
                        <div className="cut-xs flex-1 flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(0,212,255,0.02)' }}>
                          <span className="text-[var(--trench-red)] font-semibold">SELL</span>
                          <span className="text-[var(--trench-green)] font-semibold">{t.recentSell} SOL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Right side — PnL pill only, bigger */}
              <div className="absolute right-[-1px] top-3">
                <div
                  className="flex items-center justify-center px-3 py-2.5 min-w-[66px]"
                  style={{
                    background: 'rgba(8,12,18,0.92)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                  }}
                >
                  <div className="text-center">
                    <div className="text-[14px] font-bold font-mono text-[var(--trench-green)]">{t.pnl}</div>
                    <div className="text-[5px] text-[var(--trench-text-muted)] tracking-[1px]">TOTAL PnL</div>
                  </div>
                </div>
              </div>
            </Link>
          </BorderGlow>
        ))}
      </div>
    </div>
  );
}
