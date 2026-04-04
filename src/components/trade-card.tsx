import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { formatPercent } from '@/lib/utils';

interface Transaction {
  type: 'BUY' | 'SELL';
  mcap: number;
  amountSol: number;
}

interface TradeCardProps {
  tokenMint?: string;
  tokenSymbol: string;
  tokenName?: string | null;
  tokenImage?: string | null;
  totalPnlPercent: number;
  totalPnlSol?: number;
  transactions: Transaction[];
}

export function TradeCard({ tokenMint, tokenSymbol, tokenName, tokenImage, totalPnlPercent, totalPnlSol, transactions }: TradeCardProps) {
  const isWin = totalPnlPercent >= 0;
  const dexUrl = tokenMint ? `https://dexscreener.com/solana/${tokenMint}` : null;

  const Wrapper = dexUrl ? 'a' : 'div';
  const wrapperProps = dexUrl ? { href: dexUrl, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Wrapper {...wrapperProps} className="flex-shrink-0 w-[280px] snap-start flex items-start gap-3 p-3.5 cut-sm border border-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.2)] transition-colors group"
      style={{ background: 'rgba(8,12,22,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', textDecoration: 'none' }}
    >
      {/* Token image or fallback */}
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-black overflow-hidden"
        style={{
          background: tokenImage ? '#111' : isWin
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          boxShadow: isWin ? '0 0 16px rgba(34,197,94,0.3)' : '0 0 16px rgba(239,68,68,0.3)',
        }}
      >
        {tokenImage ? (
          <Image src={tokenImage} alt={tokenSymbol} width={48} height={48} className="w-full h-full object-cover" unoptimized />
        ) : (
          tokenSymbol.slice(0, 3)
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Token name + PnL */}
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-sm font-bold text-[var(--trench-text)] truncate group-hover:text-[var(--trench-accent)] transition-colors">${tokenSymbol}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span className={`text-[13px] font-bold font-mono ${isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
              {formatPercent(totalPnlPercent)}
            </span>
            {dexUrl && <ExternalLink size={10} className="text-[var(--trench-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
        </div>

        {/* Meta line */}
        <div className="text-[9px] text-[var(--trench-text-muted)] mb-2 truncate">
          {tokenName || tokenSymbol}
          {' '}&middot;{' '}
          {transactions.length} trade{transactions.length !== 1 ? 's' : ''}
          {totalPnlSol != null && (
            <> &middot; <span className={isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}>
              {isWin ? '+' : ''}{totalPnlSol.toFixed(2)} SOL
            </span></>
          )}
        </div>

        {/* Transactions */}
        <div className="flex flex-col gap-1">
          {transactions.slice(0, 4).map((tx, i) => (
            <div key={i} className="flex justify-between items-center text-[9px] px-1.5 py-1 bg-[rgba(255,255,255,0.02)] cut-xs">
              <span className={`font-semibold tracking-wide ${tx.type === 'BUY' ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                {tx.type}
              </span>
              <span className={`font-semibold font-mono ${tx.type === 'SELL' && isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-text)]'}`}>
                {tx.amountSol.toFixed(2)} SOL
              </span>
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}
