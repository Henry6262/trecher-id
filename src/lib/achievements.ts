import { parseHoldTimeToHours } from './degen-score';
import type { TraderStats } from './trade-stats';
import type { DegenScoreResult } from './degen-score';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  iconName: string; // lucide icon name
  label: string;
  description: string;
  unlocked: boolean;
  rarity: AchievementRarity;
}

interface BaseStats {
  totalPnlUsd: number;
  winRate: number;
  totalTrades: number;
}

export function computeAchievements(
  stats: BaseStats,
  traderStats: TraderStats,
  degenScore: DegenScoreResult,
): Achievement[] {
  const holdHours = parseHoldTimeToHours(traderStats.avgHoldTime);

  const defs: Omit<Achievement, 'unlocked'>[] = [
    { id: 'first_trade',    iconName: 'Target',      label: 'First Trade',    description: 'Executed your first on-chain trade.',             rarity: 'common'    },
    { id: 'ten_trades',     iconName: 'BarChart3',   label: 'Active Trader',  description: 'Completed 10 or more trades.',                    rarity: 'common'    },
    { id: 'hundred_trades', iconName: 'Zap',         label: 'Degenerate',     description: 'Over 100 trades and counting.',                   rarity: 'rare'      },
    { id: 'first_10k',      iconName: 'Trophy',      label: 'First $10K',     description: 'Realized $10,000 in total PnL.',                  rarity: 'rare'      },
    { id: 'first_100k',     iconName: 'DollarSign',  label: 'Six Figures',    description: 'Realized $100,000 in total PnL.',                 rarity: 'epic'      },
    { id: 'first_1m',       iconName: 'Anchor',      label: 'Whale',          description: 'Realized $1,000,000 in total PnL.',               rarity: 'legendary' },
    { id: 'win_rate_80',    iconName: 'Crosshair',   label: 'Sharpshooter',   description: 'Maintained an 80%+ win rate.',                    rarity: 'epic'      },
    { id: 'win_streak_5',   iconName: 'Flame',       label: 'On Fire',        description: '5 consecutive winning trades.',                   rarity: 'rare'      },
    { id: 'win_streak_10',  iconName: 'Gem',         label: 'Win Streak ×10', description: '10 consecutive winning trades.',                  rarity: 'epic'      },
    { id: 'consistency_80', iconName: 'Brain',       label: 'Consistent',     description: 'Consistency score above 80.',                     rarity: 'rare'      },
    { id: 'diamond_hands',  iconName: 'Clock',       label: 'Diamond Hands',  description: 'Average hold time over 72 hours.',                rarity: 'rare'      },
    { id: 'degen_god',      iconName: 'Crown',       label: 'Degen God',      description: 'Reached the highest Degen Score tier.',           rarity: 'legendary' },
  ];

  const conditions: Record<string, boolean> = {
    first_trade:    stats.totalTrades >= 1,
    ten_trades:     stats.totalTrades >= 10,
    hundred_trades: stats.totalTrades >= 100,
    first_10k:      stats.totalPnlUsd >= 10_000,
    first_100k:     stats.totalPnlUsd >= 100_000,
    first_1m:       stats.totalPnlUsd >= 1_000_000,
    win_rate_80:    stats.winRate >= 80,
    win_streak_5:   traderStats.winStreak >= 5,
    win_streak_10:  traderStats.winStreak >= 10,
    consistency_80: traderStats.consistency >= 80,
    diamond_hands:  holdHours >= 72,
    degen_god:      degenScore.score >= 90,
  };

  return defs.map((def) => ({ ...def, unlocked: conditions[def.id] ?? false }));
}
