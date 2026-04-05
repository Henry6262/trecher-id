import { StatElement } from './stat-element';
import type { TraderStats } from '@/lib/trade-stats';

interface EnhancedStatsProps {
  stats: TraderStats;
}

export function EnhancedStats({ stats }: EnhancedStatsProps) {
  const roiStr = `${stats.roi >= 0 ? '+' : ''}${Math.round(stats.roi)}%`;
  const roiColor = stats.roi >= 0 ? 'green' : 'red';

  const avgTradeStr = `${Math.round(stats.avgTradeSize)} SOL`;

  const bestStr = stats.bestTrade
    ? `${stats.bestTrade.symbol} +${Math.round(stats.bestTrade.pnlPercent)}%`
    : '—';
  const bestColor = stats.bestTrade && stats.bestTrade.pnlPercent >= 0 ? 'green' : 'red';

  const streakStr = `${stats.winStreak} wins`;
  const streakColor = stats.winStreak > 0 ? 'green' : 'white';

  const holdStr = stats.avgHoldTime;

  const consistencyStr = `${Math.round(stats.consistency)}/100`;
  const consistencyColor = stats.consistency >= 60 ? 'green' : stats.consistency >= 30 ? 'cyan' : 'red';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <StatElement label="ROI" value={roiStr} color={roiColor} />
      <StatElement label="Avg Trade" value={avgTradeStr} color="cyan" />
      <StatElement label="Best Trade" value={bestStr} color={bestColor as 'green' | 'red'} />
      <StatElement label="Win Streak" value={streakStr} color={streakColor as 'green' | 'white'} />
      <StatElement label="Avg Hold" value={holdStr} color="cyan" />
      <StatElement label="Consistency" value={consistencyStr} color={consistencyColor as 'green' | 'cyan' | 'red'} />
    </div>
  );
}
