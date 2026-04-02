import Image from 'next/image';
import { formatPnl } from '@/lib/utils';

interface DeploymentCardProps {
  tokenSymbol: string;
  tokenName?: string | null;
  tokenImageUrl?: string | null;
  platform: string;
  status: string;
  mcapAthUsd?: number | null;
  holders?: number | null;
  volumeUsd?: number | null;
  devPnlSol?: number | null;
  devPnlUsd?: number | null;
  deployedAt: string;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = diff / 60_000;
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

function statusBadge(status: string) {
  switch (status) {
    case 'migrated':
      return {
        label: 'MIGRATED',
        color: 'var(--trench-green)',
        bg: 'rgba(34,197,94,0.12)',
      };
    case 'bonding':
      return {
        label: 'BONDING',
        color: '#00D4FF',
        bg: 'rgba(0,212,255,0.12)',
      };
    case 'dead':
    default:
      return {
        label: 'DEAD',
        color: 'var(--trench-red)',
        bg: 'rgba(239,68,68,0.12)',
      };
  }
}

export function DeploymentCard({
  tokenSymbol,
  tokenName,
  tokenImageUrl,
  platform,
  status,
  mcapAthUsd,
  holders,
  volumeUsd,
  devPnlUsd,
  deployedAt,
}: DeploymentCardProps) {
  const isDead = status === 'dead';
  const badge = statusBadge(status);
  const hasPnl = devPnlUsd != null;
  const pnlPositive = hasPnl && devPnlUsd! >= 0;

  return (
    <div
      className="flex-shrink-0 w-[300px] snap-start cut-xs border border-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.2)] transition-colors"
      style={{
        background: 'rgba(8,12,22,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: isDead ? 0.6 : 1,
      }}
    >
      {/* Top row: icon + symbol + badge + PnL */}
      <div className="flex items-center gap-3 p-3.5 pb-2">
        {/* Token icon */}
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden"
          style={{
            background: tokenImageUrl
              ? '#111'
              : 'linear-gradient(135deg, #00D4FF, #0099CC)',
            boxShadow: isDead
              ? '0 0 12px rgba(239,68,68,0.2)'
              : '0 0 12px rgba(0,212,255,0.25)',
          }}
        >
          {tokenImageUrl ? (
            <Image
              src={tokenImageUrl}
              alt={tokenSymbol}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : isDead ? (
            <span className="text-sm">&#128128;</span>
          ) : (
            <span className="text-white">{tokenSymbol.slice(0, 3)}</span>
          )}
        </div>

        {/* Symbol + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--trench-text)] truncate">
              ${tokenSymbol}
            </span>
            <span
              className="text-[8px] font-semibold tracking-wide px-1.5 py-0.5 rounded-sm flex-shrink-0"
              style={{
                color: badge.color,
                background: badge.bg,
              }}
            >
              {badge.label}
            </span>
          </div>
          <div className="text-[9px] text-[var(--trench-text-muted)] truncate mt-0.5">
            {isDead ? '&#128128; ' : ''}Deployed {timeAgo(deployedAt)} &middot;{' '}
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
            {tokenName ? ` \u00B7 ${tokenName}` : ''}
          </div>
        </div>

        {/* PnL */}
        {hasPnl && (
          <div className="flex-shrink-0 text-right">
            <div
              className={`text-[13px] font-bold font-mono ${
                pnlPositive
                  ? 'text-[var(--trench-green)]'
                  : 'text-[var(--trench-red)]'
              }`}
            >
              {formatPnl(devPnlUsd!)}
            </div>
            <div className="text-[8px] text-[var(--trench-text-muted)]">
              DEV PnL
            </div>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div
        className="flex mx-3.5 mb-3 cut-xs"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex-1 text-center py-2 px-1">
          <div className="text-[8px] text-[var(--trench-text-muted)] tracking-wide mb-0.5">
            MCap ATH
          </div>
          <div className="text-[11px] font-bold font-mono text-[var(--trench-text)]">
            {mcapAthUsd != null ? formatCompact(mcapAthUsd) : '--'}
          </div>
        </div>
        <div
          className="w-px my-2"
          style={{ background: 'rgba(0,212,255,0.08)' }}
        />
        <div className="flex-1 text-center py-2 px-1">
          <div className="text-[8px] text-[var(--trench-text-muted)] tracking-wide mb-0.5">
            Holders
          </div>
          <div className="text-[11px] font-bold font-mono text-[var(--trench-text)]">
            {holders != null ? holders.toLocaleString() : '--'}
          </div>
        </div>
        <div
          className="w-px my-2"
          style={{ background: 'rgba(0,212,255,0.08)' }}
        />
        <div className="flex-1 text-center py-2 px-1">
          <div className="text-[8px] text-[var(--trench-text-muted)] tracking-wide mb-0.5">
            Volume
          </div>
          <div className="text-[11px] font-bold font-mono text-[var(--trench-text)]">
            {volumeUsd != null ? formatCompact(volumeUsd) : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}
