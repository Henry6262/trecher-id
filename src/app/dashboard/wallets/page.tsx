'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CutCorner } from '@/components/cut-corner';
import { CutButton } from '@/components/cut-button';
import { Input } from '@/components/ui/input';

interface Wallet {
  id: string;
  address: string;
  chain: string;
  verified: boolean;
  linkedAt: string;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddress, setNewAddress] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wallets')
      .then((r) => r.json())
      .then((data) => {
        setWallets(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function addWallet() {
    const addr = newAddress.trim();
    if (!addr) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });
      if (res.ok) {
        const created: Wallet = await res.json();
        setWallets((prev) => [...prev, created]);
        setNewAddress('');
      } else {
        const data = await res.json();
        setAddError(data.error ?? 'Failed to add wallet');
      }
    } finally {
      setAdding(false);
    }
  }

  async function removeWallet(address: string) {
    setRemoving(address);
    try {
      await fetch('/api/wallets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      setWallets((prev) => prev.filter((w) => w.address !== address));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-[var(--trench-accent)] tracking-wide">
          WALLETS
        </h1>
        <Link href="/dashboard" className="text-xs font-mono text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
          ← BACK
        </Link>
      </div>

      {/* Add wallet */}
      <CutCorner cut="md" className="w-full">
        <div className="p-5 space-y-3">
          <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
            Link a Wallet
          </p>
          <div className="flex gap-2">
            <Input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Solana wallet address"
              className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
              onKeyDown={(e) => e.key === 'Enter' && addWallet()}
            />
            <CutButton
              onClick={addWallet}
              disabled={adding || !newAddress.trim()}
              size="sm"
            >
              {adding ? 'Adding...' : 'Add'}
            </CutButton>
          </div>
          {addError && (
            <p className="text-xs font-mono text-red-400">{addError}</p>
          )}
          <p className="text-xs font-mono text-[var(--trench-text-muted)]">
            Wallets are used to fetch your on-chain trading history.
          </p>
        </div>
      </CutCorner>

      {/* Wallet list */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
          Linked Wallets ({wallets.length})
        </p>

        {loading && (
          <p className="text-xs font-mono text-[var(--trench-text-muted)] animate-pulse">Loading...</p>
        )}

        {!loading && wallets.length === 0 && (
          <CutCorner cut="sm" className="w-full">
            <div className="p-5 text-center">
              <p className="text-sm font-mono text-[var(--trench-text-muted)]">
                No wallets linked yet.
              </p>
            </div>
          </CutCorner>
        )}

        {wallets.map((wallet) => (
          <CutCorner key={wallet.id} cut="sm" className="w-full">
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-mono text-[var(--trench-text)] break-all">
                  {shortAddr(wallet.address)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-[var(--trench-text-muted)] uppercase">
                    {wallet.chain}
                  </span>
                  {wallet.verified && (
                    <span className="text-xs font-mono text-green-400">✓ verified</span>
                  )}
                  <span className="text-xs font-mono text-[var(--trench-text-muted)]">
                    {new Date(wallet.linkedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <CutButton
                variant="ghost"
                size="sm"
                onClick={() => removeWallet(wallet.address)}
                disabled={removing === wallet.address}
                className="shrink-0 text-red-400 hover:text-red-300"
              >
                {removing === wallet.address ? '...' : 'Remove'}
              </CutButton>
            </div>
          </CutCorner>
        ))}
      </div>

      {wallets.length > 0 && (
        <div className="pt-2">
          <CutButton href="/dashboard/trades" variant="secondary" size="sm">
            View Trades →
          </CutButton>
        </div>
      )}
    </div>
  );
}
