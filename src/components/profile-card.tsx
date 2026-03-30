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
    tokenImage?: string | null;
    totalPnlPercent: number;
    totalPnlSol?: number;
    transactions: { type: 'BUY' | 'SELL'; mcap: number; amountSol: number }[];
  }[];
  wallets: { address: string; verified: boolean }[];
}

export function ProfileCard({ user, stats, links, pinnedTrades, wallets }: ProfileCardProps) {
  const hasWallets = wallets.length > 0;

  return (
    <div className="w-full max-w-[620px] mx-auto">
      {/* Logo — big, centered, above card */}
      <div className="flex justify-center pt-2 pb-6">
        <img src="/logo.png" alt="Trench ID" className="h-[80px] w-auto" />
      </div>

      {/* Cyan accent line */}
      <div className="h-[2px] mb-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />

      {/* Main card — cut corners, dark glass */}
      <div className="glass cut-lg">
        {/* Hero gradient overlay */}
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 50%)' }}
          />
          <ProfileHeader
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
            username={user.username}
            bio={user.bio}
            verified={hasWallets}
          />
        </div>

        {/* Stats */}
        {stats.totalTrades > 0 && (
          <StatsStrip
            totalPnlUsd={stats.totalPnlUsd}
            winRate={stats.winRate}
            totalTrades={stats.totalTrades}
          />
        )}

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-col gap-1.5 px-5 py-4">
            {links.map((link) => (
              <LinkItem key={link.id} title={link.title} url={link.url} icon={link.icon} />
            ))}
          </div>
        )}

        {/* Trades */}
        <TradeCarousel trades={pinnedTrades} />

        {/* Wallets */}
        <WalletChips wallets={wallets} />

        {/* Footer */}
        <div className="flex justify-center py-4 border-t border-[rgba(0,212,255,0.06)]">
          <img src="/logo.png" alt="Trench ID" className="h-[36px] w-auto opacity-25" />
        </div>
      </div>
    </div>
  );
}
