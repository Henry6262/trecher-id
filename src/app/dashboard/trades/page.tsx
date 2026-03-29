'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CutCorner } from '@/components/cut-corner';
import { CutButton } from '@/components/cut-button';

interface TradeTransaction {
  type: 'BUY' | 'SELL';
  amountSol: number;
  mcap: number;
  timestamp: number;
}

interface Trade {
  tokenMint: string;
  tokenSymbol: string;
  tokenName?: string | null;
  walletAddress: string;
  transactions: TradeTransaction[];
  totalPnlSol: number;
  totalPnlPercent: number;
}

interface PinnedTrade {
  id: string;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string | null;
  walletAddress: string;
  totalPnlPercent: number;
  totalPnlSol: number;
  transactions: TradeTransaction[];
}

function pnlColor(pct: number) {
  if (pct > 0) return 'text-green-400';
  if (pct < 0) return 'text-red-400';
  return 'text-[var(--trench-text-muted)]';
}

function pnlSign(pct: number) {
  return pct > 0 ? '+' : '';
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pinned, setPinned] = useState<PinnedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasWallets, setHasWallets] = useState(true);
  const [pinning, setPinning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [walletsRes, pinnedRes] = await Promise.all([
          fetch('/api/wallets'),
          fetch('/api/trades/pin'),
        ]);
        const wallets = await walletsRes.json();
        if (!Array.isArray(wallets) || wallets.length === 0) {
          setHasWallets(false);
          setLoading(false);
          return;
        }
        setHasWallets(true);

        if (pinnedRes.ok) {
          const pinnedData = await pinnedRes.json();
          setPinned(Array.isArray(pinnedData) ? pinnedData : []);
        }

        const tradesRes = await fetch('/api/trades');
        if (tradesRes.ok) {
          const data = await tradesRes.json();
          setTrades(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pinnedMints = new Set(pinned.map((p) => `${p.walletAddress}:${p.tokenMint}`));

  async function pinTrade(trade: Trade) {
    const key = `${trade.walletAddress}:${trade.tokenMint}`;
    setPinning(key);
    try {
      const res = await fetch('/api/trades/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: trade.walletAddress,
          tokenMint: trade.tokenMint,
          tokenSymbol: trade.tokenSymbol,
          tokenName: trade.tokenName ?? null,
          totalPnlPercent: trade.totalPnlPercent,
          totalPnlSol: trade.totalPnlSol,
          transactions: trade.transactions,
        }),
      });
      if (res.ok) {
        const created: PinnedTrade = await res.json();
        setPinned((prev) => [...prev, created]);
      }
    } finally {
      setPinning(null);
    }
  }

  async function unpinTrade(id: string) {
    setPinning(id);
    try {
      await fetch('/api/trades/pin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setPinned((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setPinning(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-[var(--trench-orange)] tracking-wide">
          TRADES
        </h1>
        <Link href="/dashboard" className="text-xs font-mono text-[var(--trench-text-muted)] hover:text-[var(--trench-text)] transition-colors">
          ← BACK
        </Link>
      </div>

      {/* No wallets */}
      {!loading && !hasWallets && (
        <CutCorner cut="md" className="w-full">
          <div className="p-6 text-center space-y-3">
            <p className="text-sm font-mono text-[var(--trench-text-muted)]">
              No wallets linked yet.
            </p>
            <CutButton href="/dashboard/wallets" size="sm" variant="secondary">
              Link a Wallet
            </CutButton>
          </div>
        </CutCorner>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-xs font-mono text-[var(--trench-text-muted)] animate-pulse">
          Fetching trades...
        </p>
      )}

      {/* Pinned trades section */}
      {!loading && pinned.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
            Pinned ({pinned.length})
          </p>
          {pinned.map((p) => (
            <CutCorner
              key={p.id}
              cut="sm"
              borderColor="var(--trench-orange)"
              className="w-full"
            >
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-mono font-bold text-[var(--trench-text)]">
                    {p.tokenSymbol}
                  </p>
                  <p className="text-xs font-mono text-[var(--trench-text-muted)] truncate">
                    {p.walletAddress.slice(0, 8)}…
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-mono font-bold ${pnlColor(p.totalPnlPercent)}`}>
                    {pnlSign(p.totalPnlPercent)}{p.totalPnlPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs font-mono text-[var(--trench-text-muted)]">
                    {pnlSign(p.totalPnlSol)}{p.totalPnlSol.toFixed(3)} SOL
                  </p>
                </div>
                <CutButton
                  variant="ghost"
                  size="sm"
                  onClick={() => unpinTrade(p.id)}
                  disabled={pinning === p.id}
                  className="shrink-0"
                >
                  Unpin
                </CutButton>
              </div>
            </CutCorner>
          ))}
        </div>
      )}

      {/* All trades */}
      {!loading && hasWallets && trades.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-mono text-[var(--trench-text-muted)] tracking-widest uppercase">
            All Trades ({trades.length})
          </p>
          {trades.map((trade) => {
            const key = `${trade.walletAddress}:${trade.tokenMint}`;
            const isPinned = pinnedMints.has(key);
            return (
              <CutCorner key={key} cut="sm" className="w-full">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-bold text-[var(--trench-text)]">
                        {trade.tokenSymbol}
                      </p>
                      <p className="text-xs font-mono text-[var(--trench-text-muted)] truncate">
                        {trade.tokenMint.slice(0, 12)}…
                      </p>
                      <p className="text-xs font-mono text-[var(--trench-text-muted)] mt-1">
                        wallet: {trade.walletAddress.slice(0, 8)}…
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-mono font-bold ${pnlColor(trade.totalPnlPercent)}`}>
                        {pnlSign(trade.totalPnlPercent)}{trade.totalPnlPercent.toFixed(1)}%
                      </p>
                      <p className="text-xs font-mono text-[var(--trench-text-muted)]">
                        {pnlSign(trade.totalPnlSol)}{trade.totalPnlSol.toFixed(3)} SOL
                      </p>
                    </div>
                  </div>

                  {/* Mini transaction list */}
                  {trade.transactions.length > 0 && (
                    <div className="space-y-1">
                      {trade.transactions.slice(0, 3).map((tx, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs font-mono"
                        >
                          <span className={tx.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                            {tx.type}
                          </span>
                          <span className="text-[var(--trench-text-muted)]">
                            {tx.amountSol.toFixed(3)} SOL
                          </span>
                          <span className="text-[var(--trench-text-muted)]">
                            {new Date(tx.timestamp * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {trade.transactions.length > 3 && (
                        <p className="text-xs font-mono text-[var(--trench-text-muted)]">
                          +{trade.transactions.length - 3} more
                        </p>
                      )}
                    </div>
                  )}

                  <CutButton
                    size="sm"
                    variant={isPinned ? 'secondary' : 'primary'}
                    onClick={() => !isPinned && pinTrade(trade)}
                    disabled={isPinned || pinning === key}
                    className="w-full justify-center"
                  >
                    {isPinned ? '★ Pinned' : pinning === key ? 'Pinning...' : '+ Pin Trade'}
                  </CutButton>
                </div>
              </CutCorner>
            );
          })}
        </div>
      )}

      {!loading && hasWallets && trades.length === 0 && (
        <CutCorner cut="md" className="w-full">
          <div className="p-6 text-center">
            <p className="text-sm font-mono text-[var(--trench-text-muted)]">
              No trades found for your wallets.
            </p>
          </div>
        </CutCorner>
      )}
    </div>
  );
}
