import Image from 'next/image';
import { formatPnl } from '@/lib/utils';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  username: string;
  bio?: string | null;
  verified?: boolean;
  stats?: {
    totalPnlUsd: number;
    winRate: number;
    totalTrades: number;
  };
}

export function ProfileHeader({ avatarUrl, displayName, username, bio, verified, stats }: ProfileHeaderProps) {
  return (
    <div
      className="grid gap-5 p-6"
      style={{
        gridTemplateColumns: 'auto 1fr',
        background: 'linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 100%)',
      }}
    >
      {/* Left: avatar + verified badge */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-[88px] h-[88px] rounded-full flex-shrink-0 flex items-center justify-center text-[30px] font-bold text-black overflow-hidden"
          style={{
            background: avatarUrl ? undefined : 'var(--trench-accent)',
            boxShadow: '0 0 40px rgba(0,212,255,0.25)',
            border: '2.5px solid rgba(0,212,255,0.35)',
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={88} height={88} className="w-full h-full object-cover" unoptimized />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        {verified && (
          <span
            className="cut-xs inline-flex items-center gap-1 text-[8px] text-[var(--trench-accent)] px-1.5 py-0.5 tracking-[0.5px]"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            ✓ VERIFIED
          </span>
        )}
      </div>

      {/* Right: name + bio + stats */}
      <div>
        <h1 className="font-bold text-[22px] text-white mb-0.5">@{username}</h1>
        {bio && <p className="text-[11px] text-[var(--trench-text-muted)] mb-3.5 leading-snug">{bio}</p>}

        {stats && stats.totalTrades > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            <div
              className="cut-xs text-center py-2 px-1 glass-inner"
            >
              <div className={`text-[15px] font-bold font-mono ${stats.totalPnlUsd >= 0 ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                {formatPnl(stats.totalPnlUsd)}
              </div>
              <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">PnL</div>
            </div>
            <div
              className="cut-xs text-center py-2 px-1 glass-inner"
            >
              <div className="text-[15px] font-bold font-mono text-[var(--trench-accent)]">
                {stats.winRate.toFixed(0)}%
              </div>
              <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">WIN</div>
            </div>
            <div
              className="cut-xs text-center py-2 px-1 glass-inner"
            >
              <div className="text-[15px] font-bold font-mono text-[var(--trench-text)]">
                {stats.totalTrades}
              </div>
              <div className="text-[7px] text-[var(--trench-text-muted)] tracking-[1px]">TRADES</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
