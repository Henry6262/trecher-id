'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Copy, Check } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    id: 'twitter',
    icon: <X size={18} />,
    href: 'https://x.com/web3me_fun', // Placeholder or update if known
    label: 'Twitter',
  },
  {
    id: 'dex',
    icon: <Image src="/icons/dexscreener.webp" alt="Dex" width={18} height={18} />,
    href: '#', // Placeholder
    label: 'DexScreener',
  },
  {
    id: 'github',
    icon: <Image src="/icons/github.png" alt="GitHub" width={18} height={18} />,
    href: 'https://github.com/Henry6262/trecher-id',
    label: 'GitHub',
  },
  {
    id: 'gitbook',
    icon: <Image src="/icons/gitbook.webp" alt="Docs" width={18} height={18} />,
    href: 'https://docs.web3me.fun/',
    label: 'Docs',
  },
];

export function SocialRail() {
  const [copied, setMounted] = useState(false);
  const CA = 'COMINGSOON'; // Placeholder for Contract Address

  const copyCA = () => {
    navigator.clipboard.writeText(CA);
    setMounted(true);
    setTimeout(() => setMounted(false), 2000);
  };

  return (
    <div className="fixed top-8 left-6 z-[100] flex flex-col gap-3">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-10 w-10 items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'rgba(8,12,18,0.72)',
            border: '1px solid rgba(0,212,255,0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}
        >
          <div className="text-[var(--trench-text-muted)] group-hover:text-[var(--trench-accent)]">
            {link.icon}
          </div>
          
          <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 border border-[rgba(0,212,255,0.2)] text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            {link.label}
          </div>
        </a>
      ))}

      {/* Copy CA Button */}
      <button
        onClick={copyCA}
        className="group relative flex h-10 w-10 items-center justify-center transition-all hover:scale-110 cursor-pointer"
        style={{
          background: 'rgba(8,12,18,0.72)',
          border: '1px solid rgba(0,212,255,0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        }}
      >
        <div className="text-[var(--trench-text-muted)] group-hover:text-[var(--trench-accent)] flex items-center justify-center">
          {copied ? (
            <Check size={18} className="text-green-400" />
          ) : (
            <Image src="/icons/CA.jpg" alt="CA" width={20} height={20} className="rounded-sm grayscale group-hover:grayscale-0 transition-all" />
          )}
        </div>
        
        <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 border border-[rgba(0,212,255,0.2)] text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
          {copied ? 'Copied!' : 'Copy CA'}
        </div>
      </button>
    </div>
  );
}
