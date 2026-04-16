'use client';

import { useState, useMemo } from 'react';
import { GlassCard } from '@/components/glass-card';

interface DailyPnL {
  date: Date;
  pnlUsd: number;
}

interface PnLCalendarProps {
  dailyData: DailyPnL[];
  period: '1d' | '3d' | '7d' | '14d' | '30d';
  onPeriodChange: (period: '1d' | '3d' | '7d' | '14d' | '30d') => void;
}

export function PnLCalendar({ dailyData, period, onPeriodChange }: PnLCalendarProps) {
  const { minPnL, maxPnL, averagePnL } = useMemo(() => {
    if (dailyData.length === 0) {
      return { minPnL: 0, maxPnL: 0, averagePnL: 0 };
    }
    const pnls = dailyData.map((d) => d.pnlUsd);
    return {
      minPnL: Math.min(...pnls),
      maxPnL: Math.max(...pnls),
      averagePnL: pnls.reduce((a, b) => a + b, 0) / pnls.length,
    };
  }, [dailyData]);

  const getPnLColor = (pnl: number): string => {
    if (pnl > 0) return 'bg-green-600/60';
    if (pnl < 0) return 'bg-red-600/60';
    return 'bg-gray-600/40';
  };

  const periodDays = {
    '1d': 1,
    '3d': 3,
    '7d': 7,
    '14d': 14,
    '30d': 30,
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">PnL Calendar</h3>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(Object.keys(periodDays) as Array<keyof typeof periodDays>).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 rounded text-sm transition ${
                period === p
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
          <div>
            <p className="text-gray-400">Avg Daily PnL</p>
            <p className={`text-lg font-semibold ${averagePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${averagePnL.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Best Day</p>
            <p className="text-lg font-semibold text-green-400">
              ${maxPnL.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Worst Day</p>
            <p className="text-lg font-semibold text-red-400">
              ${minPnL.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="bg-gray-900/40 rounded p-4 overflow-x-auto">
          {dailyData.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {dailyData.map((day, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded text-center text-xs font-semibold flex items-center justify-center cursor-help transition ${getPnLColor(day.pnlUsd)} hover:opacity-80`}
                  title={`${day.date.toDateString()}: ${day.pnlUsd >= 0 ? '+' : ''}${day.pnlUsd.toFixed(2)}`}
                >
                  {day.pnlUsd >= 0 ? '📈' : '📉'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No trading data available</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
