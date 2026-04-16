'use client';

import { useEffect, useState } from 'react';
import { StatsPanel } from './stats-panel';
import { PnLCalendar } from './pnl-calendar';
import { RecentTrades } from './recent-trades';

interface AnalyticsData {
  totalPnlUsd?: number;
  winRate?: number;
  totalTrades?: number;
  holdings: Array<{ tokenSymbol: string; amount: number; valueUsd?: number }>;
  dailyPnL: Array<{ date: Date; pnlUsd: number }>;
  recentTrades: Array<{
    id: string;
    tokenSymbol: string;
    tokenName: string;
    tokenImageUrl: string | null;
    type: 'buy' | 'sell';
    amountSol: number;
    timestamp: Date;
  }>;
}

export function TradingAnalyticsPanel({ username }: { username?: string }) {
  const [period, setPeriod] = useState<'1d' | '3d' | '7d' | '14d' | '30d'>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, tradesRes] = await Promise.all([
          fetch(`/api/profile/stats?username=${username}&period=${period}`),
          fetch(`/api/profile/recent-trades?username=${username}&limit=15`),
        ]);

        if (!statsRes.ok || !tradesRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const stats = await statsRes.json();
        const trades = await tradesRes.json();

        // TODO: Fetch daily PnL from /api/profile/pnl-history or generate from trades
        const dailyPnL: AnalyticsData['dailyPnL'] = [];

        setData({
          totalPnlUsd: stats.pnlUsd,
          winRate: stats.winRate,
          totalTrades: stats.trades,
          holdings: stats.holdings || [],
          dailyPnL,
          recentTrades: (trades || []).map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, period]);

  if (!username) return null;
  if (loading) return <div className="text-gray-400 text-sm">Loading analytics...</div>;
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Trading Statistics */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Trading Statistics</h3>
        <StatsPanel
          stats={{
            totalPnlUsd: data.totalPnlUsd,
            winRate: data.winRate,
            totalTrades: data.totalTrades,
            holdings: data.holdings,
          }}
        />
      </section>

      {/* PnL Calendar */}
      <section>
        <PnLCalendar
          dailyData={data.dailyPnL}
          period={period}
          onPeriodChange={setPeriod}
        />
      </section>

      {/* Recent Trades */}
      <section>
        <RecentTrades trades={data.recentTrades} limit={15} />
      </section>
    </div>
  );
}
