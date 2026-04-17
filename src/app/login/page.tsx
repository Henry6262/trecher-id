'use client';

import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CutButton } from '@/components/cut-button';
import { Input } from '@/components/ui/input';

const TEST_AUTH_BYPASS = process.env.NEXT_PUBLIC_TEST_AUTH_BYPASS === '1';

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [testUsername, setTestUsername] = useState('playwright_user');
  const [testDisplayName, setTestDisplayName] = useState('Playwright User');
  const [creatingTestUser, setCreatingTestUser] = useState(false);
  const [testError, setTestError] = useState('');
  const participatePromptedRef = useRef(false);

  // Backup: ensure ref_code cookie is set from localStorage if user lands here directly
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('web3me_ref');
    if (ref) {
      localStorage.setItem('web3me_ref', ref);
      fetch('/api/referral/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (TEST_AUTH_BYPASS) return;
    if (!ready) return;

    if (authenticated) {
      router.replace('/dashboard');
      return;
    }

    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set('auth', '1');
    const search = nextParams.toString();
    router.replace(search ? `/?${search}` : '/?auth=1');
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (TEST_AUTH_BYPASS) return;
    if (!ready || authenticated || participatePromptedRef.current) return;
    if (new URLSearchParams(window.location.search).get('participate') !== '1') return;

    participatePromptedRef.current = true;
    login();
  }, [ready, authenticated, login]);

  async function createTestProfile() {
    setCreatingTestUser(true);
    setTestError('');

    try {
      const res = await fetch('/api/test/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, displayName: testDisplayName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTestError(data.error ?? 'Failed to create test session');
        return;
      }

      await res.json();
      router.push('/dashboard');
    } finally {
      setCreatingTestUser(false);
    }
  }

  if (TEST_AUTH_BYPASS) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md space-y-6 px-6 text-center">
          <Image
            src="/logo.png"
            alt="Web3Me"
            width={224}
            height={56}
            className="h-14 w-auto mx-auto"
            priority
          />
          <div className="space-y-2">
            <p className="text-sm text-[var(--trench-text-muted)]">Test auth bypass enabled.</p>
            <p className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)]">CREATE A TEST PROFILE</p>
          </div>
          <div className="space-y-3 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--trench-text-muted)]">Username</label>
              <Input
                aria-label="Test Username"
                value={testUsername}
                onChange={(event) => setTestUsername(event.target.value)}
                className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--trench-text-muted)]">Display Name</label>
              <Input
                aria-label="Test Display Name"
                value={testDisplayName}
                onChange={(event) => setTestDisplayName(event.target.value)}
                className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm"
              />
            </div>
          </div>
          <CutButton onClick={createTestProfile} size="lg" disabled={creatingTestUser}>
            {creatingTestUser ? 'Creating...' : 'Create Test Profile'}
          </CutButton>
          {testError && <p className="text-xs font-mono text-red-400">{testError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="relative z-10 text-[var(--trench-text-muted)] text-sm font-mono">Redirecting...</div>
    </div>
  );
}
