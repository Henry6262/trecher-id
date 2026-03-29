import { truncateAddress } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WalletChipsProps {
  wallets: { address: string; verified: boolean }[];
}

export function WalletChips({ wallets }: WalletChipsProps) {
  if (wallets.length === 0) return null;
  return (
    <div className="flex gap-1.5 justify-center flex-wrap px-5 pb-4">
      {wallets.map((w) => (
        <span key={w.address} className="text-[9px] text-[var(--trench-text-muted)] bg-[rgba(255,255,255,0.025)] px-2 py-1 cut-xs flex items-center gap-1 font-mono">
          {truncateAddress(w.address)}
          {w.verified && <Check size={8} className="text-[var(--trench-green)]" />}
        </span>
      ))}
    </div>
  );
}
