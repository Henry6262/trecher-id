import { TradeCard } from './trade-card';

interface PinnedTradeData {
  id: string;
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
    <div className="px-5 pb-4">
      <div className="text-[8px] text-[var(--trench-text-muted)] tracking-[1.5px] mb-2.5">PINNED TRADES</div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {trades.map((trade) => (
          <TradeCard
            key={trade.id}
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
