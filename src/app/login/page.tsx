'use client';

import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { BackgroundLayer } from '@/components/background-layer';
import { CutButton } from '@/components/cut-button';

export default function LoginPage() {
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      setStatus('');
      return;
    }

    setStatus('Authenticating...');
    let cancelled = false;
    let attempts = 0;

    const tryLogin = async () => {
      if (cancelled) return;
      try {
        const token = await getAccessToken();
        if (!token) {
          setStatus('Failed to get access token');
          return;
        }

        setStatus('Creating your profile...');
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const { user } = await res.json();
          setUser(user);
          setStatus('Redirecting...');
          router.push('/dashboard');
        } else {
          const text = await res.text();
          console.error('Login API error:', res.status, text);
          if (attempts < 2 && !cancelled) {
            attempts++;
            setStatus(`Retrying... (${attempts}/2)`);
            setTimeout(tryLogin, 2000);
          } else {
            setStatus(`Login failed: ${text}`);
          }
        }
      } catch (err) {
        console.error('Login fetch error:', err);
        if (attempts < 2 && !cancelled) {
          attempts++;
          setStatus(`Retrying... (${attempts}/2)`);
          setTimeout(tryLogin, 2000);
        } else {
          setStatus(`Error: ${String(err)}`);
        }
      }
    };

    tryLogin();
    return () => { cancelled = true; };
  }, [ready, authenticated, getAccessToken, setUser, router]);

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <BackgroundLayer />
      <div className="relative z-10 text-center space-y-6">
        <Image
          src="/logo.png"
          alt="Trench ID"
          width={224}
          height={56}
          className="h-14 w-auto mx-auto"
          priority
        />
        <p className="text-sm text-[var(--trench-text-muted)]">Your Web3 bio link. Backed by on-chain proof.</p>

        {!ready ? (
          <p className="text-xs font-mono text-[var(--trench-text-muted)]">Loading...</p>
        ) : authenticated ? (
          <div className="space-y-2">
            <div className="cut-xs inline-block px-4 py-2" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <span className="text-xs font-mono text-[var(--trench-accent)]">{status || 'Processing...'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <CutButton onClick={login} size="lg">Sign in with X</CutButton>
            <p className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">FREE &middot; 30 SECONDS</p>
          </div>
        )}
      </div>
    </div>
  );
}
