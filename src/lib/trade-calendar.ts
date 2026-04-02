import type { TokenTrade } from './helius';

export interface CalendarDay {
  date: string; // "YYYY-MM-DD"
  pnlSol: number;
  tradeCount: number;
}

export interface CalendarWeek {
  days: (CalendarDay | null)[]; // null = padding cell (before grid start)
}

function toDateStr(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildTradeCalendar(trades: TokenTrade[]): CalendarWeek[] {
  // Aggregate PnL per day from all transaction timestamps
  const dayMap = new Map<string, { pnlSol: number; tradeCount: number }>();

  for (const trade of trades) {
    for (const tx of trade.transactions) {
      const date = toDateStr(tx.timestamp);
      const entry = dayMap.get(date) ?? { pnlSol: 0, tradeCount: 0 };
      // Net each transaction: SELL adds pnl, BUY subtracts cost
      if (tx.type === 'SELL') {
        entry.pnlSol += tx.amountSol;
      } else {
        entry.pnlSol -= tx.amountSol;
      }
      entry.tradeCount += 1;
      dayMap.set(date, entry);
    }
  }

  // Build a 52-week grid (364 days) ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Sunday that starts our grid (52 weeks back from the nearest past Sunday)
  const dayOfWeek = today.getDay(); // 0=Sun
  const gridEnd = new Date(today);
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - dayOfWeek - 51 * 7);

  const weeks: CalendarWeek[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const week: CalendarWeek = { days: [] };

    for (let d = 0; d < 7; d++) {
      if (cursor > gridEnd) {
        week.days.push(null);
      } else {
        const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const data = dayMap.get(dateStr);
        week.days.push({
          date: dateStr,
          pnlSol: data?.pnlSol ?? 0,
          tradeCount: data?.tradeCount ?? 0,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

export function getDayColor(pnlSol: number): string {
  if (pnlSol === 0) return 'rgba(255,255,255,0.05)';
  const intensity = Math.min(Math.abs(pnlSol) / 5, 1); // saturates at 5 SOL
  const opacity = 0.2 + intensity * 0.8;
  if (pnlSol > 0) return `rgba(34,197,94,${opacity.toFixed(2)})`;
  return `rgba(239,68,68,${opacity.toFixed(2)})`;
}

export function getMonthLabel(date: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = parseInt(date.split('-')[1], 10) - 1;
  return months[month];
}
