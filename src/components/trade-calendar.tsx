import type { CalendarWeek } from '@/lib/trade-calendar';
import { getDayColor, getMonthLabel } from '@/lib/trade-calendar';

// Micro cut-corner clip-path for 10px cells
const CELL_CLIP = 'polygon(2px 0%, 100% 0%, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0% 100%, 0% 2px)';

interface TradeCalendarProps {
  weeks: CalendarWeek[];
}

export function TradeCalendar({ weeks }: TradeCalendarProps) {
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
    <div className="mb-5">
      <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2">
        TRADE HISTORY
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', alignItems: 'flex-end' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Month label above column */}
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
            {/* 7 day cells */}
            {week.days.map((day, di) => (
              <div
                key={di}
                title={
                  day && day.tradeCount > 0
                    ? `${day.date} · ${day.pnlSol >= 0 ? '+' : ''}${Math.round(day.pnlSol)} SOL · ${day.tradeCount} tx`
                    : day
                    ? day.date
                    : undefined
                }
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
  );
}
