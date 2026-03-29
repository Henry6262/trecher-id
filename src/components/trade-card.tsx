import { formatPercent } from '@/lib/utils';

interface Transaction {
  type: 'BUY' | 'SELL';
  mcap: number;
  amountSol: number;
}

interface TradeCardProps {
  tokenSymbol: string;
  tokenName?: string | null;
  totalPnlPercent: number;
  transactions: Transaction[];
}

function formatMcap(mcap: number): string {
  if (mcap >= 1_000_000_000) return `$${(mcap / 1_000_000_000).toFixed(1)}B`;
  if (mcap >= 1_000_000) return `$${(mcap / 1_000_000).toFixed(0)}M`;
  if (mcap >= 1_000) return `$${(mcap / 1_000).toFixed(0)}K`;
  return `$${mcap}`;
}

export function TradeCard({ tokenSymbol, tokenName, totalPnlPercent, transactions }: TradeCardProps) {
  const isWin = totalPnlPercent >= 0;
  return (
    <div className="flex-shrink-0 w-[280px] snap-start flex items-start gap-3 p-3.5 cut-sm bg-[rgba(255,255,255,0.025)] backdrop-blur-sm border border-[rgba(255,107,0,0.08)] hover:border-[rgba(255,107,0,0.2)] transition-colors">
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-black"
        style={{
          background: isWin ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
          boxShadow: isWin ? '0 0 16px rgba(34,197,94,0.3)' : '0 0 16px rgba(239,68,68,0.3)',
        }}
      >
        {tokenSymbol.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-sm font-bold text-[var(--trench-text)]">${tokenSymbol}</span>
          <span className={`text-[13px] font-bold font-mono ${isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
            {formatPercent(totalPnlPercent)}
          </span>
        </div>
        {tokenName && (
          <div className="text-[9px] text-[var(--trench-text-muted)] mb-2">
            {tokenName} &middot; {transactions.length} trade{transactions.length !== 1 ? 's' : ''}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {transactions.map((tx, i) => (
            <div key={i} className="flex justify-between items-center text-[9px] px-1.5 py-1 bg-[rgba(255,255,255,0.02)] cut-xs">
              <span className={`font-semibold tracking-wide ${tx.type === 'BUY' ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>{tx.type}</span>
              <span className="text-[var(--trench-text-muted)]">@{formatMcap(tx.mcap)}</span>
              <span className={`font-semibold ${tx.type === 'SELL' && totalPnlPercent >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-text)]'}`}>
                {tx.amountSol.toFixed(1)} SOL
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
