'use client';

import { useEffect, useState } from 'react';
import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';
import { Trophy, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface ParticipantPnl {
  id: string;
  username: string;
  displayName: string;
  pnlUsd: number;
  pnlSol: number;
  trades: number;
  winRate: number;
  recentTxns: number;
  lastUpdated: string;
}

interface LiveMatch {
  id: string;
  round: string;
  matchNumber: number;
  status: string;
  windowStart: string;
  windowEnd: string;
  participant1: ParticipantPnl | null;
  participant2: ParticipantPnl | null;
  winnerId: string | null;
  leader: string;
  leadMargin: number;
}

interface LiveMatchesData {
  season: { name: string; status: string; prizePoolUsd: number };
  matches: LiveMatch[];
  updatedAt: string;
}

export function LiveMatchTracker() {
  const [data, setData] = useState<LiveMatchesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<string>('');

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/cup/live-matches');
        const json = await res.json();
        setData(json);
        setLastFetch(new Date().toLocaleTimeString());
      } catch {
        // Silently fail — not critical
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
    // Poll every 30 seconds during active tournament
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <span className="text-[11px] font-mono text-[var(--trench-text-muted)] animate-pulse">
          Loading live matches...
        </span>
      </div>
    );
  }

  if (!data || data.matches.length === 0) {
    return null; // No active matches, don't show anything
  }

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-mono tracking-[2px] text-red-400">LIVE</span>
        </div>
        <span className="text-[9px] font-mono text-[var(--trench-text-muted)]">
          Updated {lastFetch}
        </span>
      </div>

      {/* Match cards */}
      {data.matches.map((match) => (
        <div
          key={match.id}
          className="cut-sm px-4 py-3"
          style={{
            background: 'rgba(8,12,18,0.85)',
            border: '1px solid rgba(0,212,255,0.1)',
          }}
        >
          {/* Match header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-accent)]">
              {match.round.toUpperCase()} • MATCH {match.matchNumber}
            </span>
            {match.status === 'live' && (
              <span className="flex items-center gap-1 text-[8px] font-mono text-green-400">
                <Zap size={8} /> ACTIVE
              </span>
            )}
          </div>

          {/* Trader battle */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Participant 1 */}
            {match.participant1 ? (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden" style={{ border: match.leader === match.participant1.id ? '2px solid #22c55e' : '1.5px solid rgba(255,255,255,0.1)' }}>
                  <AvatarImage
                    src={getPublicAvatarUrl(match.participant1.username, null)}
                    alt={match.participant1.displayName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[11px] font-bold text-white truncate">@{match.participant1.username}</div>
                <div className={`text-[16px] font-mono font-black mt-1 ${match.participant1.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {match.participant1.pnlUsd >= 0 ? '+' : ''}${Math.round(match.participant1.pnlUsd)}
                </div>
                <div className="text-[8px] font-mono text-[var(--trench-text-muted)] mt-1">
                  {match.participant1.trades} trades
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-[11px] text-[var(--trench-text-muted)]">TBD</span>
              </div>
            )}

            {/* VS divider */}
            <div className="text-center">
              <div className="text-[10px] font-black text-[var(--trench-text-muted)]">VS</div>
              {match.leader && match.leader !== 'tied' && (
                <div className="mt-1">
                  {match.leader === match.participant1?.id ? (
                    <TrendingUp size={14} className="text-green-400" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                </div>
              )}
              {match.leadMargin > 0 && (
                <div className="text-[8px] font-mono text-[var(--trench-text-muted)] mt-0.5">
                  ${Math.round(match.leadMargin)}
                </div>
              )}
            </div>

            {/* Participant 2 */}
            {match.participant2 ? (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden" style={{ border: match.leader === match.participant2.id ? '2px solid #22c55e' : '1.5px solid rgba(255,255,255,0.1)' }}>
                  <AvatarImage
                    src={getPublicAvatarUrl(match.participant2.username, null)}
                    alt={match.participant2.displayName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[11px] font-bold text-white truncate">@{match.participant2.username}</div>
                <div className={`text-[16px] font-mono font-black mt-1 ${match.participant2.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {match.participant2.pnlUsd >= 0 ? '+' : ''}${Math.round(match.participant2.pnlUsd)}
                </div>
                <div className="text-[8px] font-mono text-[var(--trench-text-muted)] mt-1">
                  {match.participant2.trades} trades
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-[11px] text-[var(--trench-text-muted)]">TBD</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
