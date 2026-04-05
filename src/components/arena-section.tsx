'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface ArenaTrader {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  pnlSol: number;
  winRate: number;
  trades: number;
}

interface Matchup {
  p1: ArenaTrader;
  p2: ArenaTrader;
  resolved: boolean;
}

function formatPnl(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1);
}

function PlayerCard({
  trader,
  isWinner,
  isLoser,
  isActive,
  ticking,
}: {
  trader: ArenaTrader | null;
  isWinner?: boolean;
  isLoser?: boolean;
  isActive?: boolean;
  ticking?: boolean;
}) {
  const [displayPnl, setDisplayPnl] = useState(trader?.pnlSol ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!ticking || !trader) return;
    intervalRef.current = setInterval(() => {
      setDisplayPnl(prev => {
        const delta = (Math.random() - 0.35) * 0.8;
        return Math.round((prev + delta) * 10) / 10;
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(intervalRef.current);
  }, [ticking, trader]);

  if (!trader) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 min-w-[170px] cut-xs"
        style={{ background: 'rgba(255,215,0,0.02)', border: '1px solid rgba(255,215,0,0.12)' }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] flex-shrink-0" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>?</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold" style={{ color: '#FFD700' }}>TBD</div>
          <div className="text-[8px] text-[var(--trench-text-muted)]">in progress...</div>
        </div>
        <span className="text-[11px] font-mono font-bold" style={{ color: '#FFD700' }}>LIVE</span>
      </div>
    );
  }

  const opacity = isLoser ? 'opacity-40' : '';
  const borderColor = isWinner
    ? 'rgba(34,197,94,0.3)'
    : isActive
      ? 'rgba(255,215,0,0.25)'
      : 'rgba(255,255,255,0.06)';
  const bg = isWinner
    ? 'rgba(34,197,94,0.05)'
    : isActive
      ? 'rgba(255,215,0,0.03)'
      : 'rgba(8,12,22,0.7)';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 min-w-[170px] cut-xs transition-all ${opacity}`}
      style={{ background: bg, border: `1px solid ${borderColor}` }}
    >
      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {trader.avatarUrl ? (
          <Image src={trader.avatarUrl} alt={trader.username} width={28} height={28} className="w-full h-full object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #333, #222)', color: '#888' }}>
            {trader.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-white truncate">@{trader.username}</div>
        <div className="text-[7px] text-[var(--trench-text-muted)]">{trader.winRate.toFixed(0)}% WR · {trader.trades} trades</div>
      </div>
      <span
        className={`text-[12px] font-mono font-bold flex-shrink-0 transition-all ${flash ? 'scale-110 text-[#FFD700]' : ''}`}
        style={{
          color: flash ? '#FFD700' : displayPnl >= 0 ? '#22c55e' : '#ef4444',
          textShadow: isWinner ? '0 0 12px rgba(34,197,94,0.3)' : 'none',
          transition: 'transform 0.3s, color 0.3s',
          transform: flash ? 'scale(1.12)' : 'scale(1)',
        }}
      >
        {formatPnl(ticking ? displayPnl : trader.pnlSol)}
      </span>
    </div>
  );
}

export function ArenaSection() {
  const [traders, setTraders] = useState<ArenaTrader[]>([]);
  const [vaultSol, setVaultSol] = useState(127.4);
  const [vaultToday, setVaultToday] = useState(3.2);
  const [vaultFlash, setVaultFlash] = useState(false);

  // Fetch top 8 traders for the bracket display
  useEffect(() => {
    fetch('/api/leaderboard?period=7d&limit=8')
      .then(r => r.json())
      .then((data: ArenaTrader[]) => {
        if (Array.isArray(data) && data.length >= 4) setTraders(data);
      })
      .catch(() => {});
  }, []);

  // Vault counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.random() * 0.15;
      setVaultSol(prev => Math.round((prev + increment) * 10) / 10);
      setVaultToday(prev => Math.round((prev + increment) * 10) / 10);
      setVaultFlash(true);
      setTimeout(() => setVaultFlash(false), 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Build bracket from real data: QF (4 matchups) → SF (2) → Final
  const qf: Matchup[] = [];
  if (traders.length >= 8) {
    qf.push({ p1: traders[0], p2: traders[7], resolved: true });
    qf.push({ p1: traders[3], p2: traders[4], resolved: false });
    qf.push({ p1: traders[1], p2: traders[6], resolved: true });
    qf.push({ p1: traders[2], p2: traders[5], resolved: false });
  }

  const sf1Winner = qf[0]?.resolved ? (qf[0].p1.pnlSol >= qf[0].p2.pnlSol ? qf[0].p1 : qf[0].p2) : null;
  const sf2Winner = qf[2]?.resolved ? (qf[2].p1.pnlSol >= qf[2].p2.pnlSol ? qf[2].p1 : qf[2].p2) : null;

  if (traders.length < 4) {
    return null; // Don't render if not enough data
  }

  return (
    <>
      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-4 sm:px-10">
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)' }} />
      </div>

      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-16 relative">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%)' }} />

        {/* Header */}
        <div className="text-center mb-10 relative">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono tracking-[3px] mb-4"
            style={{ color: '#FFD700', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            TRENCHER CUP — SEASON 1
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            The <span style={{ color: '#FFD700' }}>Arena</span>
          </h2>
          <p className="text-[12px] text-[var(--trench-text-muted)]">
            32 traders. One champion. Real money on the line.
          </p>
        </div>

        {/* Bracket — QF left, SF center, Champion right */}
        <div className="flex items-center justify-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar pb-4">
          {/* QF Left (top 2 matchups) */}
          <div className="flex flex-col gap-6 flex-shrink-0">
            <div className="text-center text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mb-1">QUARTERFINALS</div>
            {qf.slice(0, 2).map((m, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <PlayerCard
                  trader={m.p1}
                  isWinner={m.resolved && m.p1.pnlSol >= m.p2.pnlSol}
                  isLoser={m.resolved && m.p1.pnlSol < m.p2.pnlSol}
                  isActive={!m.resolved}
                  ticking={!m.resolved}
                />
                <PlayerCard
                  trader={m.p2}
                  isWinner={m.resolved && m.p2.pnlSol > m.p1.pnlSol}
                  isLoser={m.resolved && m.p2.pnlSol <= m.p1.pnlSol}
                  isActive={!m.resolved}
                  ticking={!m.resolved}
                />
              </div>
            ))}
          </div>

          {/* Connector */}
          <div className="w-4 sm:w-8 flex-shrink-0 self-stretch flex items-center justify-center">
            <div className="w-px h-full" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
          </div>

          {/* SF */}
          <div className="flex flex-col gap-6 flex-shrink-0">
            <div className="text-center text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mb-1">SEMIFINALS</div>
            <div className="flex flex-col gap-0.5">
              <PlayerCard trader={sf1Winner} isWinner={!!sf1Winner} />
              <PlayerCard trader={null} />
            </div>
            <div className="flex flex-col gap-0.5">
              <PlayerCard trader={sf2Winner} isWinner={!!sf2Winner} />
              <PlayerCard trader={null} />
            </div>
          </div>

          {/* Connector */}
          <div className="w-4 sm:w-8 flex-shrink-0 self-stretch flex items-center justify-center">
            <div className="w-px h-full" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,215,0,0.08), transparent)' }} />
          </div>

          {/* Champion */}
          <div className="flex-shrink-0 text-center px-2">
            <div className="text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mb-2">CHAMPION</div>
            <div className="text-[28px] animate-bounce" style={{ animationDuration: '3s' }}>👑</div>
            <div
              className="w-14 h-14 rounded-full mx-auto my-2 flex items-center justify-center text-[20px] font-black"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: 'black', boxShadow: '0 0 30px rgba(255,215,0,0.25), 0 0 60px rgba(255,215,0,0.1)' }}
            >
              ?
            </div>
            <div className="text-[8px] tracking-[2px]" style={{ color: '#FFD700' }}>WHO TAKES IT ALL?</div>
          </div>
        </div>

        {/* Vault bar */}
        <div
          className="flex items-center justify-between px-5 py-4 mt-8 cut-sm"
          style={{
            background: 'rgba(8,12,22,0.6)',
            border: `1px solid rgba(255,215,0,${vaultFlash ? '0.25' : '0.1'})`,
            transition: 'border-color 0.6s',
          }}
        >
          <div>
            <div className="text-[9px] tracking-[2px] font-mono" style={{ color: '#FFD700' }}>SEASON 1 PRIZE POOL</div>
            <div className="text-[8px] text-[var(--trench-text-muted)] mt-0.5">69% of all $WEB3ME fees</div>
          </div>
          <div className="text-right">
            <div
              className="text-[22px] sm:text-[26px] font-black font-mono"
              style={{
                color: '#22c55e',
                textShadow: vaultFlash
                  ? '0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.2)'
                  : '0 0 16px rgba(34,197,94,0.2)',
                transition: 'text-shadow 0.6s',
              }}
            >
              {vaultSol.toFixed(1)} SOL
            </div>
            <div className="text-[8px] text-[var(--trench-text-muted)]">
              +{vaultToday.toFixed(1)} today · Next payout in 2d 14h
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <a
            href="/leaderboard"
            className="inline-block px-6 py-2.5 text-[10px] font-bold tracking-[2px] text-black cut-xs transition-all hover:shadow-lg"
            style={{ background: '#FFD700', textDecoration: 'none' }}
          >
            ENTER THE ARENA →
          </a>
        </div>
      </section>
    </>
  );
}
