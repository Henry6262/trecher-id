import type { TraderStats } from './trade-stats';

export type ArchetypeKey =
  | 'DEGEN GOD'
  | 'DIAMOND HANDS'
  | 'SCALPER'
  | 'APE MACHINE'
  | 'WHALE HUNTER'
  | 'PAPER HANDS'
  | 'DEGENERATE'
  | 'ROOKIE';

export interface DegenArchetype {
  key: ArchetypeKey;
  description: string;
  glowColor: string;
  iconName: string; // lucide icon name
}

export interface DegenScoreResult {
  archetype: DegenArchetype;
  score: number; // 0–100
  breakdown: {
    activity: number;    // 0–25
    performance: number; // 0–25
    consistency: number; // 0–25
    conviction: number;  // 0–25
  };
}

export const ARCHETYPES: Record<ArchetypeKey, DegenArchetype> = {
  'DEGEN GOD':     { key: 'DEGEN GOD',     description: 'Elite tier. Consistent profits, high volume, iron conviction.', glowColor: '#FFD700', iconName: 'Crown'       },
  'DIAMOND HANDS': { key: 'DIAMOND HANDS', description: 'Holds through volatility. Patience pays.',                       glowColor: '#00D4FF', iconName: 'Gem'         },
  'SCALPER':       { key: 'SCALPER',       description: 'In and out fast. Precision over patience.',                       glowColor: '#a855f7', iconName: 'Scissors'    },
  'APE MACHINE':   { key: 'APE MACHINE',   description: 'Volume-first. Apes into everything.',                             glowColor: '#f97316', iconName: 'Zap'         },
  'WHALE HUNTER':  { key: 'WHALE HUNTER',  description: 'Few trades, big size. Waits for the right shot.',                 glowColor: '#3b82f6', iconName: 'Anchor'      },
  'PAPER HANDS':   { key: 'PAPER HANDS',   description: 'Exits too early. Leaves gains on the table.',                     glowColor: '#ef4444', iconName: 'TrendingDown'},
  'DEGENERATE':    { key: 'DEGENERATE',    description: 'Chaotic. No clear edge — yet.',                                   glowColor: '#ec4899', iconName: 'Activity'    },
  'ROOKIE':        { key: 'ROOKIE',        description: 'Just getting started.',                                            glowColor: '#71717a', iconName: 'Sprout'      },
};

// Parses TraderStats.avgHoldTime string ("2.5h", "3d", "45m", "<1m") → hours as float
export function parseHoldTimeToHours(s: string): number {
  if (!s || s === '0m') return 0;
  if (s.startsWith('<')) return 0.01;
  const match = s.match(/^([0-9.]+)(m|h|d)$/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'm') return val / 60;
  if (unit === 'h') return val;
  return val * 24; // 'd'
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function computeDegenScore(
  stats: TraderStats,
  base: { winRate: number; totalTrades: number; totalPnlUsd: number },
): DegenScoreResult {
  const { winRate, totalTrades } = base;
  const holdHours = parseHoldTimeToHours(stats.avgHoldTime);

  // Activity (0–25): trade volume buckets
  let activity = 0;
  if (totalTrades >= 151) activity = 25;
  else if (totalTrades >= 51) activity = 20;
  else if (totalTrades >= 21) activity = 15;
  else if (totalTrades >= 6) activity = 10;
  else if (totalTrades >= 1) activity = 5;

  // Performance (0–25): win rate + roi bonus
  const winRateScore = clamp(winRate / 4, 0, 20);
  const roiBonus = stats.roi > 100 ? 5 : stats.roi > 0 ? 2 : 0;
  const performance = clamp(Math.round(winRateScore + roiBonus), 0, 25);

  // Consistency (0–25): direct map from TraderStats.consistency (0–100)
  const consistency = Math.round(stats.consistency / 4);

  // Conviction (0–25): hold time + win streak bonus
  let holdScore = 0;
  if (holdHours >= 168) holdScore = 25;
  else if (holdHours >= 24) holdScore = 20;
  else if (holdHours >= 1) holdScore = 15;
  else if (holdHours >= 0.1) holdScore = 10;
  else holdScore = 5;

  const streakBonus = stats.winStreak >= 10 ? 5 : stats.winStreak >= 5 ? 3 : stats.winStreak >= 3 ? 1 : 0;
  const conviction = clamp(holdScore + streakBonus, 0, 25);

  const score = activity + performance + consistency + conviction;

  // Archetype classification — first rule that matches wins
  let archetypeKey: ArchetypeKey;
  if (score >= 90) {
    archetypeKey = 'DEGEN GOD';
  } else if (score >= 60 && holdHours >= 24) {
    archetypeKey = 'DIAMOND HANDS';
  } else if (score >= 60 && holdHours < 1) {
    archetypeKey = 'SCALPER';
  } else if (score >= 50 && totalTrades >= 100) {
    archetypeKey = 'APE MACHINE';
  } else if (score >= 50 && stats.avgTradeSize >= 10) {
    archetypeKey = 'WHALE HUNTER';
  } else if (totalTrades > 10 && winRate < 35) {
    archetypeKey = 'PAPER HANDS';
  } else if (score >= 30) {
    archetypeKey = 'DEGENERATE';
  } else {
    archetypeKey = 'ROOKIE';
  }

  return {
    archetype: ARCHETYPES[archetypeKey],
    score,
    breakdown: { activity, performance, consistency, conviction },
  };
}
