import {
  Target, BarChart3, Zap, Trophy, DollarSign, Anchor,
  Crosshair, Flame, Gem, Brain, Clock, Crown,
  type LucideProps,
} from 'lucide-react';
import { CutCorner } from './cut-corner';
import type { Achievement, AchievementRarity } from '@/lib/achievements';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Target, BarChart3, Zap, Trophy, DollarSign, Anchor,
  Crosshair, Flame, Gem, Brain, Clock, Crown,
};

const RARITY_BORDER: Record<AchievementRarity, string> = {
  common:    'rgba(0,212,255,0.08)',
  rare:      'rgba(0,212,255,0.20)',
  epic:      'rgba(168,85,247,0.35)',
  legendary: 'rgba(255,215,0,0.60)',
};

const RARITY_ICON_COLOR: Record<AchievementRarity, string> = {
  common:    'var(--trench-text-muted)',
  rare:      'var(--trench-accent)',
  epic:      '#a855f7',
  legendary: '#FFD700',
};

interface TrophyCaseProps {
  achievements: Achievement[];
}

export function TrophyCase({ achievements }: TrophyCaseProps) {
  const unlocked = achievements.filter((a) => a.unlocked);
  if (unlocked.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">
        ACHIEVEMENTS
      </div>
      <div className="flex flex-wrap gap-2">
        {unlocked.map((achievement) => {
          const Icon = ICON_MAP[achievement.iconName] ?? Trophy;
          const isLegendary = achievement.rarity === 'legendary';

          return (
            <div
              key={achievement.id}
              title={achievement.description}
              style={
                isLegendary
                  ? { boxShadow: '0 0 12px rgba(255,215,0,0.25)' }
                  : undefined
              }
            >
              <CutCorner
                cut="xs"
                borderColor={RARITY_BORDER[achievement.rarity]}
                bg="rgba(8,12,22,0.7)"
                style={{ width: '64px' }}
              >
                <div className="flex flex-col items-center gap-1 py-2 px-1">
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    style={{ color: RARITY_ICON_COLOR[achievement.rarity] }}
                  />
                  <span
                    className="text-center leading-tight"
                    style={{
                      fontSize: '7px',
                      fontFamily: 'var(--font-geist-mono, monospace)',
                      color: 'var(--trench-text-muted)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {achievement.label}
                  </span>
                </div>
              </CutCorner>
            </div>
          );
        })}
      </div>
    </div>
  );
}
