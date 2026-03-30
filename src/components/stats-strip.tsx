import { formatPnl } from '@/lib/utils';

interface StatsStripProps {
  totalPnlUsd: number;
  winRate: number;
  totalTrades: number;
}

export function StatsStrip({ totalPnlUsd, winRate, totalTrades }: StatsStripProps) {
  return (
    <div className="flex justify-around py-3.5 px-6 border-t border-b border-[var(--trench-border-subtle)]">
      <div className="text-center">
        <div className={`text-[15px] font-bold font-mono ${totalPnlUsd >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
          {formatPnl(totalPnlUsd)}
        </div>
        <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1px] mt-0.5">TOTAL PnL</div>
      </div>
      <div className="text-center">
        <div className="text-[15px] font-bold font-mono text-[var(--trench-accent)]">{winRate.toFixed(0)}%</div>
        <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1px] mt-0.5">WIN RATE</div>
      </div>
      <div className="text-center">
        <div className="text-[15px] font-bold font-mono text-[var(--trench-text)]">{totalTrades}</div>
        <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1px] mt-0.5">TRADES</div>
      </div>
    </div>
  );
}
