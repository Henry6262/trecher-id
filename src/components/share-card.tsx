'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareCardProps {
  username: string;
  displayName: string;
  type: 'qualified' | 'eliminated' | 'advanced' | 'champion';
  seasonName: string;
  rank?: number;
  pnlUsd?: number;
  trades?: number;
  group?: string;
}

export function ShareCardGenerator({ username, type, seasonName, rank, pnlUsd, trades, group }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const messages = {
    qualified: `I qualified for ${seasonName}! 🏆 ${trades} trades, +$${Math.round(pnlUsd ?? 0)} PnL. Join me on Web3Me!`,
    eliminated: `My ${seasonName} run is over. ${trades} trades, +$${Math.round(pnlUsd ?? 0)} PnL. See you next season! 🏆`,
    advanced: `I advanced to the next round of ${seasonName}! ${rank ? `Seed #${rank}` : ''} ${group ? `• Group ${group}` : ''}. Let's go! 🔥`,
    champion: `I WON ${seasonName.toUpperCase()}! 🏆👑 Champion of the Trencher Cup. +$${Math.round(pnlUsd ?? 0)} PnL across ${trades} trades.`,
  };

  const shareText = messages[type];

  const handleCopy = async () => {
    const text = `${shareText}\n\nhttps://trecher-id.vercel.app/${username}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    const text = `${shareText}\n\nhttps://trecher-id.vercel.app/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: `https://trecher-id.vercel.app/${username}` });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-[1px] transition-colors hover:bg-[rgba(0,212,255,0.08)]"
        style={{
          background: 'rgba(0,212,255,0.04)',
          border: '1px solid rgba(0,212,255,0.12)',
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
        }}
      >
        <Share2 size={10} />
        SHARE
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-[1px] transition-colors hover:bg-[rgba(0,212,255,0.08)]"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
        }}
      >
        {copied ? <Check size={10} style={{ color: '#22c55e' }} /> : <Copy size={10} />}
        {copied ? 'COPIED' : 'COPY'}
      </button>
    </div>
  );
}
