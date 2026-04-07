'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Holding {
  mint: string;
  symbol: string;
  name: string;
  image: string | null;
  balance: number;
  valueUsd: number;
}

function formatBalance(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function formatUsd(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

export function PortfolioView({ username }: { username: string }) {
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/portfolio?username=${username}`)
      .then(r => r.json())
      .then((d: Holding[]) => { setHoldings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 text-[9px] text-[var(--trench-text-muted)] tracking-[2px] mb-3">
          PORTFOLIO
          <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
        </div>
        <div className="h-[60px] flex items-center justify-center">
          <span className="text-[9px] tracking-[2px] text-[var(--trench-text-muted)] animate-pulse">LOADING HOLDINGS...</span>
        </div>
      </div>
    );
  }

  if (!holdings || holdings.length === 0) return null;

  const totalValue = holdings.reduce((s, h) => s + h.valueUsd, 0);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-[9px] text-[var(--trench-text-muted)] tracking-[2px] mb-3">
        PORTFOLIO
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
        {totalValue > 0 && (
          <span className="font-mono text-[8px] text-[var(--trench-accent)]">
            {formatUsd(totalValue)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {holdings.map(h => (
          <a
            key={h.mint}
            href={`https://dexscreener.com/solana/${h.mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-3 cut-xs border border-[rgba(0,212,255,0.06)] hover:border-[rgba(0,212,255,0.15)] transition-colors group"
            style={{ background: 'rgba(8,12,22,0.4)', textDecoration: 'none' }}
          >
            {/* Token image */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-bold"
              style={{ background: h.image ? '#111' : 'rgba(0,212,255,0.1)', color: 'var(--trench-accent)' }}
            >
              {h.image ? (
                <Image src={h.image} alt={h.symbol} width={32} height={32} className="w-full h-full object-cover" unoptimized />
              ) : (
                h.symbol.slice(0, 3)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-bold text-[var(--trench-text)] truncate group-hover:text-[var(--trench-accent)] transition-colors">
                  ${h.symbol}
                </span>
                {h.valueUsd > 0 && (
                  <span className="text-[11px] font-mono font-bold text-[var(--trench-text)] flex-shrink-0 ml-2">
                    {formatUsd(h.valueUsd)}
                  </span>
                )}
              </div>
              <div className="text-[8px] text-[var(--trench-text-muted)] font-mono">
                {formatBalance(h.balance)} {h.symbol}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
