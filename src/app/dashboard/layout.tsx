'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BackgroundLayer } from '@/components/background-layer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

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
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  );
}
