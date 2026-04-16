'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/glass-card';

interface TokenHoldingData {
  tokenSymbol: string;
  amount: number;
  valueUsd?: number;
}

interface WalletStats {
  totalPnlUsd?: number;
  winRate?: number;
  totalTrades?: number;
  holdings: TokenHoldingData[];
}

export function StatsPanel({ stats }: { stats: WalletStats }) {
  const { topHolding, totalHoldingValueUsd, holdingCount } = useMemo(() => {
    const withValue = stats.holdings.filter((h) => h.valueUsd && h.valueUsd > 0);
    const totalValue = withValue.reduce((sum, h) => sum + (h.valueUsd || 0), 0);
    const top = withValue.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))[0];

    return {
      topHolding: top,
      totalHoldingValueUsd: totalValue,
      holdingCount: stats.holdings.length,
    };
  }, [stats.holdings]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Win Rate */}
      <GlassCard className="p-4">
        <p className="text-sm text-gray-400 mb-1">Win Rate</p>
        <p className="text-2xl font-bold text-white">
          {stats.winRate?.toFixed(1) || '—'}%
        </p>
      </GlassCard>

      {/* Total Trades */}
      <GlassCard className="p-4">
        <p className="text-sm text-gray-400 mb-1">Total Trades</p>
        <p className="text-2xl font-bold text-white">{stats.totalTrades || 0}</p>
      </GlassCard>

      {/* Total PnL */}
      <GlassCard className="p-4">
        <p className="text-sm text-gray-400 mb-1">Total PnL</p>
        <p className={`text-2xl font-bold ${(stats.totalPnlUsd || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${stats.totalPnlUsd?.toFixed(2) || '0.00'}
        </p>
      </GlassCard>

      {/* Holdings Count */}
      <GlassCard className="p-4">
        <p className="text-sm text-gray-400 mb-1">Holdings</p>
        <p className="text-2xl font-bold text-white">{holdingCount}</p>
        {topHolding && (
          <p className="text-xs text-gray-500 mt-2">
            Top: {topHolding.tokenSymbol} (${topHolding.valueUsd?.toFixed(2) || '—'})
          </p>
        )}
      </GlassCard>
    </div>
  );
}
