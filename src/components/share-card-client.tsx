'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { CutButton } from './cut-button';
import { CutCorner } from './cut-corner';
import { DegenBadge } from './degen-badge';
import { formatPnl } from '@/lib/utils';
import type { DegenScoreResult } from '@/lib/degen-score';

interface PinnedTradePill {
  tokenSymbol: string;
  totalPnlPercent: number;
}

interface ShareCardClientProps {
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  stats: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  degenScore: DegenScoreResult;
  pinnedTrades: PinnedTradePill[];
  shareUrl: string;
}

export function ShareCardClient({ user, stats, degenScore, pinnedTrades, shareUrl }: ShareCardClientProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#050508',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${user.username}-web3me.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const tweetText = encodeURIComponent(
    `${formatPnl(stats.totalPnlUsd)} PnL · ${stats.winRate.toFixed(0)}% Win Rate · ${degenScore.archetype.key}\n\n${shareUrl}`
  );
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;

  const pnlColor = stats.totalPnlUsd >= 0 ? 'var(--trench-green)' : 'var(--trench-red)';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-10 px-4"
      style={{ background: '#050508' }}
    >
      {/* Accent line */}
      <div className="w-full max-w-[560px] h-[2px] mb-0" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />

      {/* Card capture zone — action buttons are OUTSIDE this ref */}
      <div ref={cardRef} style={{ width: '100%', maxWidth: '560px' }}>
        <CutCorner cut="lg" bg="rgba(8,12,18,0.88)" borderColor="rgba(0,212,255,0.15)" style={{ width: '100%' }}>
          <div className="flex flex-col items-center gap-5 px-8 py-8">

            {/* Avatar */}
            <div
              style={{
                clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.5), rgba(0,212,255,0.15), rgba(0,212,255,0.4))',
                padding: '2px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  clipPath: 'polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)',
                  background: '#0a0a0f',
                  width: '110px',
                  height: '110px',
                  overflow: 'hidden',
                }}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={110}
                    height={110}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[40px] font-bold text-black" style={{ background: 'var(--trench-accent)' }}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="text-center">
              <div className="text-[28px] font-black text-white tracking-tight">@{user.username}</div>
            </div>

            {/* Degen Badge */}
            <DegenBadge result={degenScore} size="md" />

            {/* Stats strip */}
            <div className="flex gap-2 w-full">
              {[
                { value: formatPnl(stats.totalPnlUsd), label: 'PNL', color: pnlColor },
                { value: `${stats.winRate.toFixed(0)}%`, label: 'WIN RATE', color: stats.winRate >= 50 ? 'var(--trench-green)' : 'var(--trench-red)' },
                { value: String(stats.totalTrades), label: 'TRADES', color: 'var(--trench-text)' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex-1 cut-sm flex flex-col items-center justify-center py-3 px-2"
                  style={{ background: 'rgba(8,12,18,0.6)', border: '1px solid rgba(0,212,255,0.1)' }}
                >
                  <span className="font-mono text-[17px] font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[7px] tracking-[1.5px] text-[var(--trench-text-muted)] mt-1">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)' }} />

            {/* Pinned trade pills */}
            {pinnedTrades.length > 0 && (
              <div className="w-full">
                <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">PINNED TRADES</div>
                <div className="flex flex-wrap gap-2">
                  {pinnedTrades.slice(0, 3).map((trade, i) => {
                    const isGain = trade.totalPnlPercent >= 0;
                    return (
                      <CutCorner
                        key={i}
                        cut="xs"
                        bg="rgba(8,12,22,0.7)"
                        borderColor="rgba(0,212,255,0.1)"
                      >
                        <div className="px-3 py-2 flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-white">${trade.tokenSymbol}</span>
                          <span
                            className="font-mono text-[11px] font-bold"
                            style={{ color: isGain ? 'var(--trench-green)' : 'var(--trench-red)' }}
                          >
                            {isGain ? '+' : ''}{trade.totalPnlPercent.toFixed(0)}%
                          </span>
                        </div>
                      </CutCorner>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.08), transparent)' }} />

            {/* Footer logo — inside card so it appears in PNG */}
            <Link href="/" className="opacity-20 hover:opacity-40 transition-opacity">
              <Image src="/logo.png" alt="Web3Me" width={80} height={20} className="h-5 w-auto" />
            </Link>

          </div>
        </CutCorner>
      </div>

      {/* Action buttons — OUTSIDE cardRef so they don't appear in PNG */}
      <div className="flex flex-wrap gap-3 w-full max-w-[560px] mt-4">
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]">
          <CutButton variant="primary" size="md" className="w-full justify-center">
            <Share2 size={14} />
            Share on X
          </CutButton>
        </a>
        <CutButton variant="secondary" size="md" onClick={handleCopy} className="flex-1 min-w-[120px] justify-center">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </CutButton>
        <CutButton variant="secondary" size="md" onClick={handleDownload} disabled={downloading} className="flex-1 min-w-[120px] justify-center">
          <Download size={14} />
          {downloading ? 'Saving...' : 'Save PNG'}
        </CutButton>
      </div>

      <p className="mt-4 text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
        WEB3ME · SOLANA · 2026
      </p>
    </div>
  );
}
