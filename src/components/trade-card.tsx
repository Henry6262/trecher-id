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
  totalPnlPercent: number | null;
  totalPnlSol?: number;
  transactions: Transaction[];
}

export function TradeCard({ tokenMint, tokenSymbol, tokenName, tokenImage, totalPnlPercent, totalPnlSol, transactions }: TradeCardProps) {
  const isWin = totalPnlPercent !== null ? totalPnlPercent >= 0 : (totalPnlSol ?? 0) >= 0;
  const dexUrl = tokenMint ? `https://dexscreener.com/solana/${tokenMint}` : null;
  const buyTx = transactions.find((tx) => tx.type === 'BUY');
  const sellTx = transactions.find((tx) => tx.type === 'SELL');

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

      <div className="min-w-0 flex-1">
        {/* Token name + PnL */}
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-sm font-bold text-[var(--trench-text)] truncate group-hover:text-[var(--trench-accent)] transition-colors">${tokenSymbol}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {totalPnlPercent !== null && totalPnlPercent !== 0 && (
              <span className={`text-[13px] font-bold font-mono ${isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                {formatPercent(totalPnlPercent)}
              </span>
            )}
            {totalPnlPercent === null && totalPnlSol != null && totalPnlSol !== 0 && (
              <span className={`text-[13px] font-bold font-mono ${isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                {totalPnlSol >= 0 ? '+' : ''}{totalPnlSol.toFixed(1)} SOL
              </span>
            )}
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
              {isWin ? '+' : ''}{Math.round(totalPnlSol)} SOL
            </span></>
          )}
        </div>
      </div>

      <div className="w-[96px] flex-shrink-0 flex flex-col gap-1.5">
        {[
          { label: 'BUY', tx: buyTx, valueColor: 'text-[var(--trench-text)]', labelColor: 'text-[var(--trench-green)]' },
          { label: 'SELL', tx: sellTx, valueColor: sellTx && isWin ? 'text-[var(--trench-green)]' : 'text-[var(--trench-text)]', labelColor: 'text-[var(--trench-red)]' },
        ].map((item) => (
          <div
            key={item.label}
            className="cut-xs px-2 py-1.5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center justify-between gap-2 text-[8px]">
              <span className={`font-semibold tracking-wide ${item.labelColor}`}>{item.label}</span>
              <span className={`flex items-center gap-1 font-semibold font-mono ${item.valueColor}`}>
                {item.tx ? Math.round(item.tx.amountSol) : '—'}
                {item.tx && (
                  <Image src="/sol.png" alt="SOL" width={10} height={10} className="h-[10px] w-[10px]" />
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
