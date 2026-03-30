import { ProfileHeader } from './profile-header';
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
      {/* Logo */}
      <div className="flex justify-center pt-2 pb-5">
        <img src="/logo.png" alt="Trench ID" className="h-[80px] w-auto" />
      </div>

      {/* Accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />

      {/* Main card */}
      <div className="glass cut-lg">
        {/* Hero — full width */}
        <ProfileHeader
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          username={user.username}
          bio={user.bio}
          verified={hasWallets}
          stats={stats}
        />

        {/* Content section — more margin */}
        <div className="px-8 pb-5">
          {/* Links */}
          {links.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-4">
              {links.map((link) => (
                <LinkItem key={link.id} title={link.title} url={link.url} icon={link.icon} />
              ))}
            </div>
          )}

          {/* Trades */}
          {pinnedTrades.length > 0 && (
            <div className="mb-4">
              <TradeCarousel trades={pinnedTrades} />
            </div>
          )}

          {/* Wallets */}
          <WalletChips wallets={wallets} />
        </div>

        {/* Footer */}
        <div className="flex justify-center py-3.5 border-t border-[rgba(0,212,255,0.06)]">
          <img src="/logo.png" alt="Trench ID" className="h-[28px] w-auto opacity-25" />
        </div>
      </div>
    </div>
  );
}
