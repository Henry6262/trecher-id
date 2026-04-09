'use client';

import { useState } from 'react';
import type { CalendarWeek } from '@/lib/trade-calendar';
import { getDayColor, getMonthLabel } from '@/lib/trade-calendar';

// Micro cut-corner clip-path for 10px cells
const CELL_CLIP = 'polygon(2px 0%, 100% 0%, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0% 100%, 0% 2px)';

interface TradeCalendarProps {
  weeks: CalendarWeek[];
}

interface CalendarTooltip {
  date: string;
  pnlSol: number;
  tradeCount: number;
  x: number;
  y: number;
}

export function TradeCalendar({ weeks }: TradeCalendarProps) {
  const [tooltip, setTooltip] = useState<CalendarTooltip | null>(null);

  if (weeks.length === 0) return null;

  // Compute month labels: show label above the first column of each new month
  const monthLabels: (string | null)[] = weeks.map((week, i) => {
    const firstDay = week.days.find((d) => d !== null);
    if (!firstDay) return null;
    const label = getMonthLabel(firstDay.date);
    if (i === 0) return label;
    const prevWeek = weeks[i - 1];
    const prevDay = prevWeek.days.find((d) => d !== null);
    if (!prevDay) return label;
    if (getMonthLabel(prevDay.date) !== label) return label;
    return null;
  });

  return (
    <div className="mb-5 relative z-20">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[9px] tracking-[2px] text-[var(--trench-text-muted)]">
          TRADE HISTORY
        </div>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
        <span className="font-mono text-[8px] text-[var(--trench-text-muted)]">
          LAST 6M
        </span>
      </div>
      <div
        className="cut-sm overflow-x-auto no-scrollbar border"
        style={{ background: 'rgba(8,12,22,0.4)', borderColor: 'rgba(0,212,255,0.06)' }}
      >
        <div className="min-w-max px-3 py-3" style={{ display: 'flex', flexDirection: 'row', gap: '2px', alignItems: 'flex-end' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div
                style={{
                  height: '10px',
                  fontSize: '6px',
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  color: 'var(--trench-text-muted)',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {monthLabels[wi] ?? ''}
              </div>
              {week.days.map((day, di) => (
                <div
                  key={di}
                  onMouseEnter={(event) => {
                    if (!day || day.tradeCount <= 0) return;

                    const rect = event.currentTarget.getBoundingClientRect();
                    setTooltip({
                      date: day.date,
                      pnlSol: day.pnlSol,
                      tradeCount: day.tradeCount,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: '10px',
                    height: '10px',
                    clipPath: CELL_CLIP,
                    background: day ? getDayColor(day.pnlSol) : 'transparent',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[120] -translate-x-1/2"
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
        >
          <div
            className="px-2.5 py-1.5 whitespace-nowrap text-center"
            style={{
              background: 'rgba(8,12,18,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              transform: 'translateY(-100%)',
            }}
          >
            <div className="text-[8px] font-mono text-[#888] mb-0.5">{tooltip.date}</div>
            <div className="text-[9px] font-mono font-bold" style={{ color: tooltip.pnlSol >= 0 ? '#22c55e' : '#ef4444' }}>
              {tooltip.pnlSol >= 0 ? '+' : ''}
              {Math.round(tooltip.pnlSol)} SOL
            </div>
            <div className="text-[8px] font-mono text-[#666]">{tooltip.tradeCount} tx</div>
          </div>
          <div
            className="mx-auto h-0 w-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(255,255,255,0.1)',
              marginTop: -1,
            }}
          />
        </div>
      )}
    </div>
  );
}
