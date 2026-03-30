import { formatPnl } from '@/lib/utils';

interface StatsStripProps {
  totalPnlUsd: number;
  winRate: number;
  totalTrades: number;
}

export function StatsStrip({ totalPnlUsd, winRate, totalTrades }: StatsStripProps) {
  return (
    <div className="grid grid-cols-3 gap-2 px-5 pb-4">
      <div className="cut-sm glass-inner text-center py-3 px-2">
        <div className={`text-lg font-bold font-mono ${totalPnlUsd >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
          {formatPnl(totalPnlUsd)}
        </div>
        <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-0.5">TOTAL PnL</div>
      </div>
      <div className="cut-sm glass-inner text-center py-3 px-2">
        <div className="text-lg font-bold font-mono text-[var(--trench-accent)]">
          {winRate.toFixed(0)}%
        </div>
        <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-0.5">WIN RATE</div>
      </div>
      <div className="cut-sm glass-inner text-center py-3 px-2">
        <div className="text-lg font-bold font-mono text-[var(--trench-text)]">
          {totalTrades}
        </div>
        <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1.5px] mt-0.5">TRADES</div>
      </div>
    </div>
  );
}
