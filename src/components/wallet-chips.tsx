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
        <span key={w.address} className="text-[9px] text-[var(--trench-text-muted)] backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 font-mono" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
          {truncateAddress(w.address)}
          {w.verified && <Check size={8} className="text-[var(--trench-green)]" />}
        </span>
      ))}
    </div>
  );
}
