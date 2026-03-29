'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { BackgroundLayer } from '@/components/background-layer';
import { CutButton } from '@/components/cut-button';

export default function LoginPage() {
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!ready || !authenticated) return;
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { user } = await res.json();
        setUser(user);
        router.push('/dashboard');
      }
    })();
  }, [ready, authenticated, getAccessToken, setUser, router]);

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <BackgroundLayer />
      <div className="relative z-10 text-center space-y-6">
        <h1 className="text-3xl font-mono font-bold text-[var(--trench-orange)]">TRENCH ID</h1>
        <p className="text-sm text-[var(--trench-text-muted)]">Your Web3 bio link. Backed by on-chain proof.</p>
        <CutButton onClick={login} size="lg">Sign in with X</CutButton>
      </div>
    </div>
  );
}
