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
      {/* Logo centered above card */}
      <div className="flex justify-center py-5">
        <img src="/logo.png" alt="Trench ID" className="h-[64px] w-auto opacity-85" />
      </div>

      {/* Cyan accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }} />

      {/* Main glass card — darker, stronger blur */}
      <div
        className="rounded-xl"
        style={{
          background: 'rgba(8, 12, 18, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(0, 212, 255, 0.12)',
        }}
      >
        {/* Hero section with gradient */}
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none rounded-t-xl"
            style={{ background: 'linear-gradient(180deg, rgba(0,212,255,0.06) 0%, transparent 60%)' }}
          />
          <ProfileHeader
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
            username={user.username}
            bio={user.bio}
            verified={hasWallets}
          />
        </div>

        {/* Stats in individual glass cards */}
        {stats.totalTrades > 0 && (
          <StatsStrip
            totalPnlUsd={stats.totalPnlUsd}
            winRate={stats.winRate}
            totalTrades={stats.totalTrades}
          />
        )}

        {/* Custom links */}
        {links.length > 0 && (
          <div className="flex flex-col gap-1.5 px-5 py-4">
            {links.map((link) => (
              <LinkItem key={link.id} title={link.title} url={link.url} icon={link.icon} />
            ))}
          </div>
        )}

        {/* Pinned trades carousel */}
        <TradeCarousel trades={pinnedTrades} />

        {/* Verified wallets */}
        <WalletChips wallets={wallets} />

        {/* Footer with logo */}
        <div className="flex justify-center py-4 border-t border-[rgba(255,255,255,0.04)]">
          <img src="/logo.png" alt="Trench ID" className="h-[32px] w-auto opacity-30" />
        </div>
      </div>
    </div>
  );
}
