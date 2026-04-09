'use client';

import { usePrivy } from '@privy-io/react-auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';

const TEST_AUTH_BYPASS = process.env.NEXT_PUBLIC_TEST_AUTH_BYPASS === '1';

function buildPathWithoutAuthParams(pathname: string, searchParams: URLSearchParams): string {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.delete('auth');
  nextParams.delete('participate');
  nextParams.delete('next');
  const search = nextParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function PrivySessionBridge() {
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const authPromptKeyRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);
  const lastSyncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (TEST_AUTH_BYPASS || !ready || authenticated) {
      return;
    }

    if (searchParams.get('auth') !== '1') {
      authPromptKeyRef.current = null;
      return;
    }

    const promptKey = `${pathname}?${searchParams.toString()}`;
    if (authPromptKeyRef.current === promptKey) {
      return;
    }

    authPromptKeyRef.current = promptKey;
    login();
  }, [authenticated, login, pathname, ready, searchParams]);

  useEffect(() => {
    if (TEST_AUTH_BYPASS || !ready || !authenticated || syncInFlightRef.current) {
      return;
    }

    let active = true;
    syncInFlightRef.current = true;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!active || !token || lastSyncedTokenRef.current === token) {
          return;
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!active || !response.ok) {
          return;
        }

        const { user } = await response.json();
        if (!active) {
          return;
        }

        lastSyncedTokenRef.current = token;
        setUser(user);
        localStorage.removeItem('web3me_ref');

        const next = searchParams.get('next');
        if (next && next.startsWith('/')) {
          router.replace(next);
          return;
        }

        if (searchParams.get('auth') === '1' || searchParams.get('participate') === '1') {
          router.replace(buildPathWithoutAuthParams(pathname, new URLSearchParams(searchParams.toString())));
        }
      } finally {
        syncInFlightRef.current = false;
      }
    })();

    return () => {
      active = false;
      syncInFlightRef.current = false;
    };
  }, [authenticated, getAccessToken, pathname, ready, router, searchParams, setUser]);

  return null;
}
