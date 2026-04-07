'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackgroundLayer } from '@/components/background-layer';

const TEST_AUTH_BYPASS = process.env.NEXT_PUBLIC_TEST_AUTH_BYPASS === '1';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
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
    if (authReady && !isAuthenticated) router.push('/login');
  }, [authReady, isAuthenticated, router]);

  if (!authReady || !isAuthenticated) {
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
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  );
}
