'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BackgroundLayer } from '@/components/background-layer';
import { useAuthStore } from '@/stores/auth';
import { CutButton } from '@/components/cut-button';

const TABS = [
  { href: '/dashboard', label: 'PROFILE' },
  { href: '/dashboard/trades', label: 'TRADES' },
  { href: '/dashboard/wallets', label: 'WALLETS' },
] as const;

function hasCookie(name: string) {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith(`${name}=`));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout: privyLogout } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    // Only redirect if Privy is ready AND not authenticated AND no session cookie
    if (ready && !authenticated && !hasCookie('session')) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  async function handleLogout() {
    try { await privyLogout(); } catch {}
    clearUser();
    // Clear session cookie
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <BackgroundLayer />
        <div className="relative z-10 text-[var(--trench-text-muted)] text-sm font-mono">Loading...</div>
      </div>
    );
  }

  // Show dashboard if authenticated OR if session cookie exists (Privy still loading)
  if (!authenticated && !hasCookie('session')) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <BackgroundLayer />
        <div className="relative z-10 text-[var(--trench-text-muted)] text-sm font-mono">Redirecting...</div>
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
          <div className="flex items-center gap-2">
            {/* Tab navigation */}
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
            <CutButton onClick={handleLogout} variant="ghost" size="sm" className="text-[var(--trench-text-muted)] hover:text-[var(--trench-red)]">
              ✕
            </CutButton>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
