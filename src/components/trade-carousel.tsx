import { TradeCard } from './trade-card';

interface PinnedTradeData {
  id: string;
  tokenMint?: string;
  tokenSymbol: string;
  tokenName?: string | null;
  tokenImage?: string | null;
  totalPnlPercent: number;
  totalPnlSol?: number;
  transactions: { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[];
}

interface TradeCarouselProps {
  trades: PinnedTradeData[];
}

export function TradeCarousel({ trades }: TradeCarouselProps) {
  if (trades.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-[9px] text-[var(--trench-text-muted)] tracking-[2px] mb-3">
        PINNED TRADES
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
        <span className="font-mono text-[8px] text-[var(--trench-text-muted)]">
          {trades.length} LIVE
        </span>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto no-scrollbar px-1 pb-1 snap-x snap-mandatory">
        {trades.map((trade) => (
          <TradeCard
            key={trade.id}
            tokenMint={trade.tokenMint}
            tokenSymbol={trade.tokenSymbol}
            tokenName={trade.tokenName}
            tokenImage={trade.tokenImage}
            totalPnlPercent={trade.totalPnlPercent}
            totalPnlSol={trade.totalPnlSol}
            transactions={trade.transactions}
          />
        ))}
      </div>
    </div>
  );
}
