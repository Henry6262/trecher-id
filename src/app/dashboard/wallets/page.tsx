'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { GlassCard } from '@/components/glass-card';
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
  const { linkWallet } = usePrivy();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddress, setNewAddress] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    fetch('/api/wallets')
      .then((r) => r.json())
      .then((data) => setWallets(Array.isArray(data) ? data : []))
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
        setShowManual(false);
      } else {
        const data = await res.json();
        setAddError(data.error ?? 'Failed to add wallet');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleConnectWallet() {
    try {
      await linkWallet();
      // After Privy links the wallet, we need to sync it to our DB
      // The linked wallet address will be available via usePrivy().user.linkedAccounts
      // For now, show the manual input as fallback
    } catch {
      // User cancelled or error — show manual option
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
    <div className="space-y-6 pb-16">
      {/* Connect wallet */}
      <GlassCard cut={10}>
        <div className="p-5 space-y-4">
          <p className="text-[10px] font-mono text-[var(--trench-text-muted)] tracking-[2px] uppercase">
            Link a Wallet
          </p>

          <div className="flex gap-3">
            <CutButton onClick={handleConnectWallet} size="sm">
              Connect Wallet
            </CutButton>
            <CutButton onClick={() => setShowManual(!showManual)} variant="secondary" size="sm">
              {showManual ? 'Hide' : 'Paste Address'}
            </CutButton>
          </div>

          {showManual && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Solana wallet address"
                  className="bg-transparent border-[var(--trench-border)] text-[var(--trench-text)] font-mono text-sm focus-visible:ring-[var(--trench-accent)] focus-visible:ring-1"
                  onKeyDown={(e) => e.key === 'Enter' && addWallet()}
                />
                <CutButton onClick={addWallet} disabled={adding || !newAddress.trim()} size="sm">
                  {adding ? '...' : 'Add'}
                </CutButton>
              </div>
              {addError && <p className="text-[10px] font-mono text-red-400">{addError}</p>}
            </div>
          )}

          <p className="text-[10px] font-mono text-[var(--trench-text-muted)]">
            Connect your Solana wallet or paste an address. We fetch your on-chain trading history automatically.
          </p>
        </div>
      </GlassCard>

      {/* Wallet list */}
      <div className="space-y-3">
        <p className="text-[10px] font-mono text-[var(--trench-text-muted)] tracking-[2px] uppercase">
          Linked Wallets ({wallets.length})
        </p>

        {loading && (
          <p className="text-[10px] font-mono text-[var(--trench-text-muted)] animate-pulse">Loading...</p>
        )}

        {!loading && wallets.length === 0 && (
          <GlassCard cut={8} glow={false}>
            <div className="p-5 text-center">
              <p className="text-[11px] font-mono text-[var(--trench-text-muted)]">No wallets linked yet.</p>
            </div>
          </GlassCard>
        )}

        {wallets.map((wallet) => (
          <GlassCard key={wallet.id} cut={8} glow={false}>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-mono text-[var(--trench-text)] break-all">{shortAddr(wallet.address)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold text-[var(--trench-accent)] uppercase" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.12)' }}>
                    {wallet.chain}
                  </span>
                  {wallet.verified && (
                    <span className="cut-xs text-[7px] tracking-[1px] px-2 py-0.5 font-semibold text-[var(--trench-green)]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)' }}>
                      VERIFIED
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-[var(--trench-text-muted)]">
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
          </GlassCard>
        ))}
      </div>

      {wallets.length > 0 && (
        <CutButton href="/dashboard/trades" variant="secondary" size="sm">
          View Trades →
        </CutButton>
      )}
    </div>
  );
}
