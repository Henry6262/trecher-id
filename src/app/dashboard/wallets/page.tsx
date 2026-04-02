'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import { CutButton } from '@/components/cut-button';
import { Input } from '@/components/ui/input';

interface Wallet {
  id: string;
  address: string;
  chain: string;
  verified: boolean;
  linkedAt: string;
  totalPnlUsd?: number | null;
  winRate?: number | null;
  totalTrades?: number | null;
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
  const [syncing, setSyncing] = useState<string | null>(null);

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
    // Solana addresses are base58, 32-44 chars
    const isValidSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
    if (!isValidSolana) {
      setAddError('Invalid Solana address (must be 32-44 base58 characters)');
      return;
    }
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

  async function syncWallet(address: string) {
    setSyncing(address);
    try {
      // TODO: POST /api/wallets/sync when endpoint exists
      await new Promise(resolve => setTimeout(resolve, 1000)); // placeholder
    } finally {
      setSyncing(null);
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
      <GlassCard className="w-full p-5" cut={12}>
        <div className="space-y-3">
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
      </GlassCard>

      {/* Wallet list */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
          Linked Wallets ({wallets.length})
        </p>

        {loading && (
          <p className="text-xs font-mono text-[var(--trench-text-muted)] animate-pulse">Loading...</p>
        )}

        {!loading && wallets.length === 0 && (
          <GlassCard className="w-full p-8 text-center" cut={12}>
            <p className="text-2xl mb-2">◎</p>
            <p className="text-sm font-mono font-bold text-[var(--trench-text)] mb-1">No wallets linked yet</p>
            <p className="text-xs font-mono text-[var(--trench-text-muted)] max-w-xs mx-auto">
              Add your Solana wallet address below to import your on-chain trading history.
            </p>
          </GlassCard>
        )}

        {wallets.map((wallet) => (
          <GlassCard key={wallet.id} className="w-full p-4" cut={8}>
            <div className="flex items-center justify-between gap-3">
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
                {(wallet.totalPnlUsd != null || wallet.totalTrades != null) && (
                  <p className="text-xs font-mono text-[var(--trench-text-muted)] mt-1">
                    {wallet.totalPnlUsd != null && (
                      <span className={wallet.totalPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {wallet.totalPnlUsd >= 0 ? '+' : ''}{wallet.totalPnlUsd >= 1000 ? `$${(wallet.totalPnlUsd/1000).toFixed(1)}K` : `$${wallet.totalPnlUsd.toFixed(0)}`}
                      </span>
                    )}
                    {wallet.winRate != null && <span> · {wallet.winRate.toFixed(0)}% WR</span>}
                    {wallet.totalTrades != null && <span> · {wallet.totalTrades} trades</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <CutButton
                  variant="ghost"
                  size="sm"
                  onClick={() => syncWallet(wallet.address)}
                  disabled={syncing === wallet.address}
                  className="shrink-0 text-[#00D4FF] hover:text-[#33DDFF]"
                >
                  {syncing === wallet.address ? '...' : 'Sync'}
                </CutButton>
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
            </div>
          </GlassCard>
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
