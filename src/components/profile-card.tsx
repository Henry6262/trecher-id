import { ProfileHeader } from './profile-header';
import { StatsStrip } from './stats-strip';
import { LinkItem } from './link-item';
import { TradeCarousel } from './trade-carousel';
import { WalletChips } from './wallet-chips';

interface ProfileCardProps {
  user: {
    username: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  stats: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
  links: { id: string; title: string; url: string; icon?: string | null }[];
  pinnedTrades: {
    id: string;
    tokenSymbol: string;
    tokenName?: string | null;
    totalPnlPercent: number;
    transactions: { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[];
  }[];
  wallets: { address: string; verified: boolean }[];
}

export function ProfileCard({ user, stats, links, pinnedTrades, wallets }: ProfileCardProps) {
  const hasWallets = wallets.length > 0;
  return (
    <div className="w-full max-w-[560px] mx-auto">
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />
      <div className="glass cut-md overflow-hidden">
        <ProfileHeader avatarUrl={user.avatarUrl} displayName={user.displayName} username={user.username} bio={user.bio} verified={hasWallets} />
        {stats.totalTrades > 0 && <StatsStrip totalPnlUsd={stats.totalPnlUsd} winRate={stats.winRate} totalTrades={stats.totalTrades} />}
        {links.length > 0 && (
          <div className="flex flex-col gap-2 px-5 py-4">
            {links.map((link) => <LinkItem key={link.id} title={link.title} url={link.url} icon={link.icon} />)}
          </div>
        )}
        <TradeCarousel trades={pinnedTrades} />
        <WalletChips wallets={wallets} />
        <div className="text-center py-3.5 border-t border-[rgba(255,255,255,0.03)]">
          <span className="text-[9px] text-[rgba(0,212,255,0.4)] tracking-[2px] font-mono">TRENCH ID</span>
        </div>
      </div>
    </div>
  );
}
