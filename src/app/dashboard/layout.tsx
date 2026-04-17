'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CutButton } from '@/components/cut-button';

const TEST_AUTH_BYPASS = process.env.NEXT_PUBLIC_TEST_AUTH_BYPASS === '1';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [testSessionState, setTestSessionState] = useState<'loading' | 'authenticated' | 'anonymous'>(
    TEST_AUTH_BYPASS ? 'loading' : 'anonymous',
  );

  useEffect(() => {
    if (!TEST_AUTH_BYPASS) return;

    let active = true;
    fetch('/api/profile', { cache: 'no-store' })
      .then((response) => {
        if (active) {
          setTestSessionState(response.ok ? 'authenticated' : 'anonymous');
        }
      })
      .catch(() => {
        if (active) {
          setTestSessionState('anonymous');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const authReady = TEST_AUTH_BYPASS ? testSessionState !== 'loading' : ready;
  const isAuthenticated = TEST_AUTH_BYPASS ? testSessionState === 'authenticated' : authenticated;

  useEffect(() => {
    if (!authReady || isAuthenticated) return;
    router.push(`/?auth=1&next=${encodeURIComponent(pathname)}`);
  }, [authReady, isAuthenticated, pathname, router]);

  if (!authReady || !isAuthenticated) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 text-[var(--trench-text-muted)] text-sm font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <div
          className="mb-6 flex items-center justify-between gap-3 cut-sm px-3 py-3"
          style={{
            background: 'rgba(8,12,18,0.72)',
            border: '1px solid rgba(0,212,255,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }
              router.push('/leaderboard');
            }}
            className="text-[11px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)] transition-colors hover:text-[var(--trench-text)]"
          >
            ← BACK
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/leaderboard"
              className="text-[10px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)] transition-colors hover:text-[var(--trench-text)]"
            >
              LEADERBOARD
            </Link>
            <CutButton href="/" size="sm" variant="secondary">
              WEB3ME
            </CutButton>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
