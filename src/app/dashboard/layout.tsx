'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BackgroundLayer } from '@/components/background-layer';

const TABS = [
  { href: '/dashboard', label: 'PROFILE' },
  { href: '/dashboard/trades', label: 'TRADES' },
  { href: '/dashboard/wallets', label: 'WALLETS' },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !authenticated) router.push('/login');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <BackgroundLayer />
        <div className="relative z-10 text-[var(--trench-text-muted)] text-sm font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundLayer />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Logo + nav row */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Image src="/logo.png" alt="Trench ID" width={120} height={30} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
          </Link>
          {/* Tab navigation */}
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`cut-xs px-3 py-1.5 text-[10px] font-mono tracking-[1.5px] font-semibold transition-all ${
                    isActive
                      ? 'bg-[rgba(0,212,255,0.12)] text-[var(--trench-accent)] border border-[rgba(0,212,255,0.2)]'
                      : 'text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] border border-transparent hover:border-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
