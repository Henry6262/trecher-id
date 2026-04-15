
'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { Sparkles, TrendingUp, History, Wallet, ExternalLink, AlertCircle } from 'lucide-react';
import { CutButton } from '@/components/cut-button';

interface RewardAccount {
  totalEarnedUsd: number;
  totalPaidUsd: number;
  pendingUsd: number;
}

interface Payout {
  id: string;
  amountUsd: number;
  amountSol: number;
  type: string;
  status: string;
  txSignature: string | null;
  createdAt: string;
}

export function RewardsPanel() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<RewardAccount | null>(null);
  const [history, setHistory] = useState<Payout[]>([]);

  useEffect(() => {
    fetch('/api/profile/rewards')
      .then((r) => r.json())
      .then((data) => {
        setAccount(data.account);
        setHistory(data.history);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs font-mono text-[var(--trench-text-muted)] p-8">SYNCING VAULT DATA...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5" cut={12}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--trench-accent)]/10 border border-[var(--trench-accent)]/20">
              <Sparkles size={16} className="text-[var(--trench-accent)]" />
            </div>
            <p className="text-[10px] font-mono tracking-[2px] text-[var(--trench-text-muted)] uppercase">Total Earned</p>
          </div>
          <p className="text-2xl font-black text-white">${account?.totalEarnedUsd.toFixed(2) ?? '0.00'}</p>
          <p className="mt-1 text-[10px] font-mono text-[var(--trench-text-muted)]">ALL-TIME REWARDS</p>
        </GlassCard>

        <GlassCard className="p-5" cut={12}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <p className="text-[10px] font-mono tracking-[2px] text-[var(--trench-text-muted)] uppercase">Pending</p>
          </div>
          <p className="text-2xl font-black text-white">${account?.pendingUsd.toFixed(2) ?? '0.00'}</p>
          <p className="mt-1 text-[10px] font-mono text-[var(--trench-text-muted)]">AWAITING PAYOUT</p>
        </GlassCard>

        <GlassCard className="p-5" cut={12}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Wallet size={16} className="text-blue-400" />
            </div>
            <p className="text-[10px] font-mono tracking-[2px] text-[var(--trench-text-muted)] uppercase">Total Paid</p>
          </div>
          <p className="text-2xl font-black text-white">${account?.totalPaidUsd.toFixed(2) ?? '0.00'}</p>
          <p className="mt-1 text-[10px] font-mono text-[var(--trench-text-muted)]">SENT TO WALLET</p>
        </GlassCard>
      </section>

      <GlassCard className="p-6" cut={16}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <History size={18} className="text-[var(--trench-text-muted)]" />
            <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">Payout History</h3>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 p-4 rounded-full bg-white/5 border border-white/10">
              <AlertCircle size={24} className="text-[var(--trench-text-muted)]" />
            </div>
            <p className="text-sm font-mono text-[var(--trench-text-muted)] max-w-[30ch]">
              No payouts recorded yet. Top the leaderboard to earn from the vault.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((payout) => (
              <div 
                key={payout.id}
                className="flex items-center justify-between p-4 cut-sm bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--trench-accent)] font-bold uppercase">
                      {payout.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[8px] font-mono text-[var(--trench-text-muted)] tracking-widest">
                      {new Date(payout.createdAt).toLocaleDateString().toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-black text-white">${payout.amountUsd.toFixed(2)}</span>
                    <span className="text-[10px] font-mono text-[var(--trench-text-muted)]">({payout.amountSol.toFixed(3)} SOL)</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[9px] font-mono px-2 py-0.5 cut-xs border ${
                    payout.status === 'paid' 
                      ? 'text-green-400 bg-green-400/10 border-green-400/20' 
                      : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                  }`}>
                    {payout.status.toUpperCase()}
                  </span>
                  {payout.txSignature && (
                    <a 
                      href={`https://solscan.io/tx/${payout.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-mono text-[var(--trench-text-muted)] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      SOLSCAN <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <section className="p-6 cut-lg bg-[var(--trench-accent)]/5 border border-[var(--trench-accent)]/10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-mono font-bold text-white mb-2">HOW IT WORKS</h3>
            <p className="text-sm text-[var(--trench-text-muted)] leading-relaxed">
              Web3Me redistributes <span className="text-white font-bold">69% of all platform fees</span> back to top-performing traders. 
              Weekly payouts are calculated every Sunday based on the 7-day leaderboard.
            </p>
          </div>
          <div className="shrink-0">
            <CutButton href="/leaderboard" variant="primary">
              VIEW LEADERBOARD
            </CutButton>
          </div>
        </div>
      </section>
    </div>
  );
}
