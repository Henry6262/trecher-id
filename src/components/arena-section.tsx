'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GlassCard } from './glass-card';

// ─── Types ───────────────────────────────────────────────────

interface ArenaTrader {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  pnlSol: number;
  winRate: number;
  trades: number;
}

type Phase = 'intro' | 'battle' | 'ko' | 'bracket' | 'transition';

const PHASE_DURATIONS: Record<Phase, number> = {
  intro: 2400,
  battle: 4000,
  ko: 2800,
  bracket: 4000,
  transition: 1000,
};

// ─── Avatar ──────────────────────────────────────────────────

function Avatar({ trader, size = 80 }: { trader: ArenaTrader; size?: number }) {
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size, border: '2px solid rgba(255,255,255,0.1)' }}>
      {trader.avatarUrl ? (
        <Image src={trader.avatarUrl} alt={trader.username} width={size} height={size} className="w-full h-full object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-black" style={{ background: 'linear-gradient(135deg, #333, #1a1a1a)', color: '#555', fontSize: size * 0.35 }}>
          {trader.username.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ─── Bracket Slot ────────────────────────────────────────────

function Slot({
  trader,
  state,
}: {
  trader: ArenaTrader | null;
  state: 'empty' | 'neutral' | 'winner' | 'loser' | 'latest';
}) {
  if (!trader || state === 'empty') {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 min-w-[140px] cut-xs" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <span className="text-[8px] font-mono text-[#333]">—</span>
      </div>
    );
  }

  const styles = {
    neutral: { bg: 'rgba(8,12,22,0.6)', border: 'rgba(255,255,255,0.06)', opacity: 1, nameColor: 'white', pnlColor: '#888', filter: '', strikethrough: false },
    winner: { bg: 'rgba(34,197,94,0.04)', border: 'rgba(34,197,94,0.25)', opacity: 1, nameColor: 'white', pnlColor: '#22c55e', filter: '', strikethrough: false },
    loser: { bg: 'rgba(8,12,22,0.3)', border: 'rgba(255,255,255,0.03)', opacity: 0.3, nameColor: '#555', pnlColor: '#444', filter: 'grayscale(100%)', strikethrough: true },
    latest: { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.5)', opacity: 1, nameColor: '#00D4FF', pnlColor: '#00D4FF', filter: '', strikethrough: false },
    empty: { bg: '', border: '', opacity: 1, nameColor: '', pnlColor: '', filter: '', strikethrough: false },
  }[state];

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 min-w-[140px] cut-xs transition-all duration-500 ${state === 'latest' ? 'animate-[winnerGlow_1.5s_ease-in-out_infinite]' : ''}`}
      style={{ background: styles.bg, border: `1px solid ${styles.border}`, opacity: styles.opacity }}
    >
      <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" style={{ filter: styles.filter }}>
        {trader.avatarUrl ? (
          <Image src={trader.avatarUrl} alt={trader.username} width={20} height={20} className="w-full h-full object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[7px] font-bold" style={{ background: '#222', color: '#666' }}>
            {trader.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className={`text-[9px] font-bold truncate flex-1 ${styles.strikethrough ? 'line-through' : ''}`} style={{ color: styles.nameColor }}>
        @{trader.username}
      </span>
      <span className="text-[9px] font-mono font-bold flex-shrink-0" style={{ color: styles.pnlColor }}>
        {Math.round(trader.pnlSol)}
      </span>
    </div>
  );
}

// ─── SVG Connector ───────────────────────────────────────────

function Connector({ pairs, pairHeight, pairGap, litPairs }: { pairs: number; pairHeight: number; pairGap: number; litPairs: boolean[] }) {
  const W = 24;
  const totalH = pairs * pairHeight + (pairs - 1) * pairGap;
  const paths: { d: string; lit: boolean }[] = [];

  for (let i = 0; i < pairs; i++) {
    const topY = i * (pairHeight + pairGap) + pairHeight * 0.25;
    const bottomY = i * (pairHeight + pairGap) + pairHeight * 0.75;
    const destY = (topY + bottomY) / 2;
    const midX = W / 2;
    const lit = litPairs[i] || false;

    paths.push({ d: `M 0 ${topY} H ${midX}`, lit });
    paths.push({ d: `M 0 ${bottomY} H ${midX}`, lit });
    paths.push({ d: `M ${midX} ${topY} V ${bottomY}`, lit });
    paths.push({ d: `M ${midX} ${destY} H ${W}`, lit });
  }

  return (
    <svg width={W} height={totalH} className="flex-shrink-0" style={{ minWidth: W }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none"
          stroke={p.lit ? 'rgba(0,212,255,0.7)' : 'rgba(255,255,255,0.1)'}
          strokeWidth={p.lit ? 1.5 : 1}
          style={p.lit ? { filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.4))' } : {}}
        />
      ))}
    </svg>
  );
}

// ─── Main ────────────────────────────────────────────────────

export function ArenaSection() {
  const [traders, setTraders] = useState<ArenaTrader[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [matchIdx, setMatchIdx] = useState(0);
  const [battlePnl1, setBattlePnl1] = useState(0);
  const [battlePnl2, setBattlePnl2] = useState(0);
  const [vaultSol, setVaultSol] = useState(127);

  // Bracket state — starts EMPTY, fills progressively
  const [qfResults, setQfResults] = useState<(ArenaTrader | null)[]>([null, null, null, null]); // winners
  const [sfPlayers, setSfPlayers] = useState<(ArenaTrader | null)[]>([null, null, null, null]);
  const [sfResults, setSfResults] = useState<(ArenaTrader | null)[]>([null, null]);
  const [champion, setChampion] = useState<ArenaTrader | null>(null);

  // QF matchups (fixed from data)
  const [qfMatchups, setQfMatchups] = useState<{ p1: ArenaTrader; p2: ArenaTrader }[]>([]);
  const [allMatchups, setAllMatchups] = useState<{ p1: ArenaTrader; p2: ArenaTrader; round: string; label: string }[]>([]);

  // Fetch data
  useEffect(() => {
    fetch('/api/leaderboard?period=7d&limit=8')
      .then(r => r.json())
      .then((data: ArenaTrader[]) => {
        if (!Array.isArray(data) || data.length < 8) return;
        setTraders(data);

        const qf = [
          { p1: data[0], p2: data[7] },
          { p1: data[3], p2: data[4] },
          { p1: data[1], p2: data[6] },
          { p1: data[2], p2: data[5] },
        ];
        setQfMatchups(qf);

        // Pre-compute sequence for animation
        const qfW = qf.map(m => m.p1.pnlSol >= m.p2.pnlSol ? m.p1 : m.p2);
        const sf = [{ p1: qfW[0], p2: qfW[1] }, { p1: qfW[2], p2: qfW[3] }];
        const sfW = sf.map(m => m.p1.pnlSol >= m.p2.pnlSol ? m.p1 : m.p2);

        setAllMatchups([
          ...qf.map((m, i) => ({ ...m, round: 'QUARTERFINAL', label: `QF ${i + 1}` })),
          ...sf.map((m, i) => ({ p1: m.p1, p2: m.p2, round: 'SEMIFINAL', label: `SF ${i + 1}` })),
          { p1: sfW[0], p2: sfW[1], round: 'THE FINAL', label: 'GRAND FINAL' },
        ]);
      })
      .catch(() => {});
  }, []);

  const currentMatch = allMatchups[matchIdx];
  const currentWinner = currentMatch && (currentMatch.p1.pnlSol >= currentMatch.p2.pnlSol ? currentMatch.p1 : currentMatch.p2);
  const currentLoser = currentMatch && (currentWinner === currentMatch.p1 ? currentMatch.p2 : currentMatch.p1);

  // Record result when entering bracket phase
  useEffect(() => {
    if (phase !== 'bracket' || !currentWinner || !currentLoser) return;
    const idx = matchIdx;

    if (idx < 4) {
      // QF result
      setQfResults(prev => { const n = [...prev]; n[idx] = currentWinner; return n; });
      // Fill SF slot
      setSfPlayers(prev => {
        const n = [...prev];
        if (idx === 0) n[0] = currentWinner;
        if (idx === 1) n[1] = currentWinner;
        if (idx === 2) n[2] = currentWinner;
        if (idx === 3) n[3] = currentWinner;
        return n;
      });
    } else if (idx < 6) {
      // SF result
      const sfIdx = idx - 4;
      setSfResults(prev => { const n = [...prev]; n[sfIdx] = currentWinner; return n; });
    } else {
      // Final result
      setChampion(currentWinner);
    }
  }, [phase, matchIdx, currentWinner, currentLoser]);

  // Phase sequencer
  const advancePhase = useCallback(() => {
    setPhase(prev => {
      const order: Phase[] = ['intro', 'battle', 'ko', 'bracket', 'transition'];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  useEffect(() => {
    if (!currentMatch) return;
    const timer = setTimeout(() => {
      if (phase === 'transition') {
        setMatchIdx(prev => (prev + 1) % allMatchups.length);
      }
      advancePhase();
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase, currentMatch, advancePhase, allMatchups.length]);

  // Battle PnL race
  useEffect(() => {
    if (phase !== 'battle' || !currentMatch) return;
    setBattlePnl1(0);
    setBattlePnl2(0);
    const t1 = Math.round(currentMatch.p1.pnlSol);
    const t2 = Math.round(currentMatch.p2.pnlSol);
    const steps = 24;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setBattlePnl1(Math.round(t1 * eased));
      setBattlePnl2(Math.round(t2 * eased));
      if (step >= steps) clearInterval(interval);
    }, PHASE_DURATIONS.battle / steps);
    return () => clearInterval(interval);
  }, [phase, currentMatch]);

  // Vault counter
  useEffect(() => {
    const interval = setInterval(() => {
      setVaultSol(prev => prev + Math.floor(Math.random() * 2));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!currentMatch || traders.length < 8) return null;

  // Slot state helper
  function qfSlotState(matchI: number, playerIdx: 0 | 1): 'neutral' | 'winner' | 'loser' | 'latest' {
    if (!qfResults[matchI]) return 'neutral'; // not resolved yet
    const m = qfMatchups[matchI];
    const player = playerIdx === 0 ? m.p1 : m.p2;
    if (phase === 'bracket' && matchIdx === matchI && currentWinner?.username === player.username) return 'latest';
    if (qfResults[matchI]?.username === player.username) return 'winner';
    return 'loser';
  }

  function sfSlotState(sfIdx: number, playerIdx: 0 | 1): 'empty' | 'neutral' | 'winner' | 'loser' | 'latest' {
    const player = sfPlayers[sfIdx * 2 + playerIdx];
    if (!player) return 'empty';
    if (!sfResults[sfIdx]) return 'neutral';
    if (phase === 'bracket' && matchIdx === 4 + sfIdx && currentWinner?.username === player.username) return 'latest';
    if (sfResults[sfIdx]?.username === player.username) return 'winner';
    return 'loser';
  }

  const PAIR_H = 72; // height of a matchup (2 slots)
  const PAIR_GAP = 12;

  return (
    <>
      <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)' }} />
      </div>

      <section className="max-w-[780px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
        {/* Header — trophy + title */}
        <div className="text-center mb-6 relative">
          <div className="mx-auto mb-4 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] relative" style={{ filter: 'drop-shadow(0 0 40px rgba(0,212,255,0.3)) drop-shadow(0 0 80px rgba(0,212,255,0.1))' }}>
            <Image src="/trencher-cup.png" alt="Trencher Cup Trophy" fill className="object-contain" priority />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-1">
            The Trencher <span style={{ color: '#00D4FF' }}>Cup</span>
          </h2>
          <p className="text-[12px] text-[var(--trench-text-muted)]">32 traders. One champion. Real money on the line.</p>
        </div>

        <GlassCard cut={14} bg="rgba(8,12,18,0.55)">
        <div className="relative overflow-hidden px-4 sm:px-6 py-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)' }} />

        {/* Reward info — absolute top right */}
        <div className="absolute top-4 right-5 text-right z-10">
          <div className="text-[22px] font-black font-mono" style={{ color: '#22c55e', textShadow: '0 0 16px rgba(34,197,94,0.2)' }}>{vaultSol} SOL</div>
          <div className="text-[8px] tracking-[1px] text-[var(--trench-text-muted)]">69% of fees · growing</div>
        </div>

        {/* Match animation stage */}
        <div className="relative min-h-[280px] flex flex-col items-center justify-center mb-8">
          <div className="text-center mb-5">
            <div className="text-[8px] tracking-[3px] text-[var(--trench-text-muted)]">{currentMatch.round}</div>
            <div className="text-[10px] tracking-[2px] font-mono" style={{ color: '#00D4FF' }}>{currentMatch.label}</div>
          </div>

          {/* INTRO */}
          {phase === 'intro' && (
            <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
              <div className="flex flex-col items-center gap-3 animate-[slideFromLeft_0.6s_ease-out_forwards]">
                <div style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.3))' }}><Avatar trader={currentMatch.p1} size={90} /></div>
                <div className="text-center">
                  <div className="text-[14px] font-black text-white">@{currentMatch.p1.username}</div>
                  <div className="text-[9px] text-[var(--trench-text-muted)]">{Math.round(currentMatch.p1.winRate)}% WR · {currentMatch.p1.trades} trades</div>
                </div>
              </div>
              <div className="animate-[vsSlam_0.4s_ease-out_0.3s_both]">
                <div className="text-[36px] sm:text-[48px] font-black" style={{ color: '#00D4FF', textShadow: '0 0 30px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.2)', letterSpacing: '4px' }}>VS</div>
              </div>
              <div className="flex flex-col items-center gap-3 animate-[slideFromRight_0.6s_ease-out_forwards]">
                <div style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.3))' }}><Avatar trader={currentMatch.p2} size={90} /></div>
                <div className="text-center">
                  <div className="text-[14px] font-black text-white">@{currentMatch.p2.username}</div>
                  <div className="text-[9px] text-[var(--trench-text-muted)]">{Math.round(currentMatch.p2.winRate)}% WR · {currentMatch.p2.trades} trades</div>
                </div>
              </div>
            </div>
          )}

          {/* BATTLE */}
          {phase === 'battle' && (
            <div className="w-full max-w-[500px] flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <Avatar trader={currentMatch.p1} size={48} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">@{currentMatch.p1.username}</span>
                    <span className="text-[14px] font-black font-mono" style={{ color: '#22c55e' }}>+{battlePnl1} SOL</span>
                  </div>
                  <div className="h-3 w-full cut-xs overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full transition-all duration-150" style={{
                      width: `${Math.min(Math.abs(battlePnl1) / (Math.max(Math.abs(Math.round(currentMatch.p1.pnlSol)), Math.abs(Math.round(currentMatch.p2.pnlSol))) || 1) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #00D4FF, #0099cc)', boxShadow: '0 0 12px rgba(0,212,255,0.4)',
                    }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)' }} />
                <span className="text-[10px] font-mono tracking-[2px]" style={{ color: '#00D4FF' }}>VS</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)' }} />
              </div>
              <div className="flex items-center gap-3">
                <Avatar trader={currentMatch.p2} size={48} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">@{currentMatch.p2.username}</span>
                    <span className="text-[14px] font-black font-mono" style={{ color: '#ef4444' }}>+{battlePnl2} SOL</span>
                  </div>
                  <div className="h-3 w-full cut-xs overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full transition-all duration-150" style={{
                      width: `${Math.min(Math.abs(battlePnl2) / (Math.max(Math.abs(Math.round(currentMatch.p1.pnlSol)), Math.abs(Math.round(currentMatch.p2.pnlSol))) || 1) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #ef4444, #dc2626)', boxShadow: '0 0 12px rgba(239,68,68,0.4)',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KO */}
          {phase === 'ko' && currentWinner && currentLoser && (
            <div className="flex items-center justify-center gap-6 sm:gap-12 w-full">
              <div className="flex flex-col items-center gap-3 animate-[winnerPop_0.5s_ease-out_forwards]">
                <div style={{ filter: 'drop-shadow(0 0 30px rgba(34,197,94,0.5))' }}><Avatar trader={currentWinner} size={100} /></div>
                <div className="text-[16px] font-black" style={{ color: '#22c55e' }}>@{currentWinner.username}</div>
                <div className="text-[12px] font-mono font-bold" style={{ color: '#22c55e' }}>+{Math.round(currentWinner.pnlSol)} SOL</div>
                <div className="text-[10px] tracking-[3px] font-bold px-4 py-1 cut-xs" style={{ color: '#000', background: '#22c55e' }}>ADVANCES</div>
              </div>
              <div className="flex flex-col items-center gap-3 animate-[loserFade_0.8s_ease-in_forwards]">
                <div style={{ filter: 'grayscale(100%) brightness(0.4)' }}><Avatar trader={currentLoser} size={70} /></div>
                <div className="text-[13px] font-bold text-white line-through opacity-40">@{currentLoser.username}</div>
                <div className="text-[10px] tracking-[3px] font-bold px-4 py-1 cut-xs" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>ELIMINATED</div>
              </div>
            </div>
          )}

          {/* BRACKET VIEW — progressive, starts empty */}
          {phase === 'bracket' && (
            <div className="w-full animate-[fadeIn_0.5s_ease-out]">
              {/* Bracket grid — QF → SF → Champion */}
              <div className="flex items-center justify-center overflow-x-auto no-scrollbar">
                {/* QF — all 8 players always shown */}
                <div className="flex-shrink-0">
                  <div className="text-center text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mb-2">QUARTERFINALS</div>
                  <div className="flex flex-col" style={{ gap: `${PAIR_GAP}px` }}>
                    {qfMatchups.map((m, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <Slot trader={m.p1} state={qfSlotState(i, 0)} />
                        <Slot trader={m.p2} state={qfSlotState(i, 1)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* QF → SF connector */}
                <Connector pairs={2} pairHeight={PAIR_H * 2 + PAIR_GAP} pairGap={PAIR_GAP}
                  litPairs={[!!qfResults[0] && !!qfResults[1], !!qfResults[2] && !!qfResults[3]]} />

                {/* SF — empty until QF fills them */}
                <div className="flex-shrink-0">
                  <div className="text-center text-[7px] tracking-[2px] text-[var(--trench-text-muted)] mb-2">SEMIFINALS</div>
                  <div className="flex flex-col justify-center" style={{ gap: `${PAIR_GAP + PAIR_H}px`, paddingTop: PAIR_H / 2 + PAIR_GAP / 2 }}>
                    <div className="flex flex-col gap-0.5">
                      <Slot trader={sfPlayers[0]} state={sfSlotState(0, 0)} />
                      <Slot trader={sfPlayers[1]} state={sfSlotState(0, 1)} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Slot trader={sfPlayers[2]} state={sfSlotState(1, 0)} />
                      <Slot trader={sfPlayers[3]} state={sfSlotState(1, 1)} />
                    </div>
                  </div>
                </div>

                {/* SF → Champion connector */}
                <Connector pairs={1} pairHeight={PAIR_H * 2 + PAIR_H + PAIR_GAP} pairGap={0}
                  litPairs={[!!champion]} />

                {/* Champion — replaces Final column, texts absolute so avatar is perfectly centered */}
                <div className="flex-shrink-0 flex items-center justify-center relative" style={{ width: '64px', alignSelf: 'center' }}>
                  {/* CHAMPION label — absolute above */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] tracking-[2px] whitespace-nowrap" style={{ color: '#00D4FF' }}>CHAMPION</div>

                  {champion ? (
                    <div className="relative animate-[winnerPop_0.5s_ease-out_forwards]">
                      <div className="w-[60px] h-[60px] rounded-full mx-auto overflow-hidden" style={{ border: '3px solid #00D4FF', boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}>
                        {champion.avatarUrl ? (
                          <Image src={champion.avatarUrl} alt="" width={60} height={60} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[20px] font-black" style={{ background: 'linear-gradient(135deg, #00D4FF, #33DDFF)', color: '#000' }}>
                            {champion.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Name — absolute below */}
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black whitespace-nowrap" style={{ color: '#00D4FF' }}>@{champion.username}</div>
                    </div>
                  ) : (
                    <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[18px] font-black" style={{ background: 'linear-gradient(135deg, #00D4FF, #33DDFF)', color: '#000', boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}>?</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRANSITION */}
          {phase === 'transition' && (
            <div className="flex items-center justify-center">
              <div className="text-[9px] tracking-[3px] text-[var(--trench-text-muted)] animate-pulse">NEXT MATCHUP...</div>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-1.5 mt-2">
          {allMatchups.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === matchIdx ? '24px' : '8px', background: i < matchIdx ? '#22c55e' : i === matchIdx ? '#00D4FF' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Link href="/leaderboard" className="inline-block px-6 py-2.5 text-[10px] font-bold tracking-[2px] text-black cut-xs" style={{ background: '#00D4FF', textDecoration: 'none' }}>ENTER THE ARENA →</Link>
        </div>
        </div>
        </GlassCard>
      </section>

      <style jsx global>{`
        @keyframes slideFromLeft { from { transform: translateX(-80px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideFromRight { from { transform: translateX(80px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes vsSlam { 0% { transform: scale(3); opacity: 0; } 60% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes winnerPop { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes loserFade { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.85) translateY(16px); opacity: 0.25; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes winnerGlow { 0%, 100% { box-shadow: 0 0 0 rgba(0,212,255,0); } 50% { box-shadow: 0 0 16px rgba(0,212,255,0.2); } }
      `}</style>
    </>
  );
}
