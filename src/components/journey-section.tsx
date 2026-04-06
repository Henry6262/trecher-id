'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GlassCard } from './glass-card';

// ─── Steps ───────────────────────────────────────────────────

const STEPS = [
  { label: 'SIGN IN', title: 'Sign in with X', desc: 'Connect your Twitter. Your handle becomes your Web3Me URL.' },
  { label: 'WALLETS', title: 'Link your wallets', desc: 'Add Solana wallets. We index your real trading history.' },
  { label: 'RANK', title: 'Climb the leaderboard', desc: 'Your realized PnL determines your rank. Updated hourly.' },
  { label: 'COMPETE', title: 'Enter the Trencher Cup', desc: 'Top 32 qualify. Groups, knockout, champion crowned.' },
  { label: 'EARN', title: 'Earn from the Vault', desc: '69% of $WEB3ME fees. Weekly payouts + Cup prizes.' },
];

const CYCLE_MS = 8000;

// ─── Screen 1: Sign In — Profile Creation Flow ──────────────

function ScreenSignIn() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      <div className="w-[80px] h-[80px] rounded-full p-[3px] animate-[ringPulse_3s_ease-in-out_infinite]" style={{ background: 'linear-gradient(135deg, #1DA1F2, #fff)' }}>
        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#0a0a12' }}>
          <span className="text-[28px]">𝕏</span>
        </div>
      </div>
      <div className="flex items-center w-full max-w-[300px]">
        <div className="px-3 py-2.5 text-[12px] text-[#555] cut-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRight: 'none' }}>
          web3me.fun/
        </div>
        <div className="px-3 py-2.5 text-[14px] font-bold text-white flex-1 font-mono cut-xs overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="animate-[typeIn_3s_steps(12)_infinite]">yourusername</span>
        </div>
      </div>
      <div className="text-[18px] text-[rgba(255,255,255,0.2)] animate-[arrowBounce_1.5s_ease-in-out_infinite]">↓</div>
      <div className="flex items-center gap-3 w-full max-w-[300px] px-4 py-3 cut-sm animate-[fadeUp_0.5s_ease-out_1.5s_both]" style={{ background: 'rgba(8,12,22,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1DA1F2, #eee)' }} />
        <div className="flex-1">
          <div className="text-[13px] font-black text-white">@yourusername</div>
          <div className="text-[9px] text-[#888]">web3me.fun/yourusername</div>
        </div>
        <span className="text-[16px] text-[#22c55e]">✓</span>
      </div>
    </div>
  );
}

// ─── Screen 2: Wallets — Branded Wallet + Stats ────────────

function ScreenWallets() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      {/* Wallet image with glow */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)', filter: 'blur(20px)' }} />
        <Image src="/wallet.png" alt="Web3Me Wallet" width={200} height={160} className="relative z-10 drop-shadow-[0_0_16px_rgba(255,255,255,0.1)]" style={{ objectFit: 'contain' }} />
      </div>

      {/* Scan line effect */}
      <div className="w-full max-w-[260px] h-[1px] relative overflow-hidden">
        <div className="absolute inset-0 animate-[scanLine_2.5s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', width: '50%' }} />
      </div>

      <div className="text-center">
        <div className="text-[14px] font-extrabold">Indexing your wallets</div>
        <div className="text-[10px] text-[#555] mt-1">Every swap on Solana, tracked and verified</div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {[
          { val: '847', label: 'TRADES' },
          { val: '142', label: 'TOKENS' },
          { val: '+68', label: 'PNL', icon: true },
        ].map(s => (
          <div key={s.label} className="text-center px-4 py-2.5 cut-xs" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[16px] font-black font-mono text-white flex items-center justify-center gap-1">
              {s.val}
              {s.icon && <Image src="/sol.png" alt="SOL" width={12} height={12} className="h-3 w-auto" />}
            </div>
            <div className="text-[7px] tracking-[1.5px] text-[#555] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen 3: Rank — Podium + Your Spot ─────────────────────

function ScreenRank() {
  const podium = [
    { rank: 2, label: '2ND', color: '#C0C0C0', name: '@blknoiz', pnl: 98, barH: 72, avSize: 28, initial: 'B' },
    { rank: 1, label: '1ST', color: '#FFD700', name: '@ansem', pnl: 142, barH: 105, avSize: 34, initial: 'A' },
    { rank: 3, label: '3RD', color: '#CD7F32', name: '@cryptowiz', pnl: 76, barH: 52, avSize: 28, initial: 'C' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Podium */}
      <div className="flex items-end gap-1 -mt-4">
        {podium.map(p => (
          <div key={p.rank} className="flex flex-col items-center">
            {/* Avatar */}
            <div className="rounded-full flex items-center justify-center font-black mb-1.5" style={{
              width: p.avSize, height: p.avSize,
              background: `linear-gradient(145deg, ${p.color}, ${p.color}55)`,
              border: `2px solid ${p.color}`,
              boxShadow: `0 0 12px ${p.color}25`,
              fontSize: p.avSize * 0.34, color: '#0a0a12',
            }}>
              {p.initial}
            </div>
            {/* Name */}
            <div className="text-[8px] font-bold mb-1" style={{ color: p.rank === 1 ? '#bbb' : '#666' }}>{p.name}</div>
            {/* Podium block */}
            <div className="w-[90px] relative overflow-hidden flex items-center justify-center" style={{
              height: p.barH,
              background: `linear-gradient(180deg, ${p.color}15 0%, ${p.color}06 100%)`,
              borderTop: `2px solid ${p.color}`,
              borderLeft: `1px solid ${p.color}18`,
              borderRight: `1px solid ${p.color}18`,
              borderBottom: `1px solid ${p.color}0a`,
            }}>
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-black font-mono text-white">+{p.pnl}</span>
                <Image src="/sol.png" alt="SOL" width={12} height={12} className="h-3 w-auto" />
              </div>
              {p.rank === 1 && (
                <div className="absolute inset-0 pointer-events-none animate-[podiumShimmer_3s_ease-in-out_infinite]" style={{ background: 'linear-gradient(180deg, rgba(255,215,0,0.06) 0%, transparent 60%)' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Your position — spaced from podium */}
      <div className="flex items-center gap-2.5 w-full max-w-[260px] px-3.5 py-2 cut-xs animate-[youPulse_2.5s_ease-in-out_infinite] mt-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-[16px] font-black font-mono text-white">#7</span>
        <div className="rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black" style={{ width: 24, height: 24, background: 'linear-gradient(145deg, #ddd, #999)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#0a0a12' }}>Y</div>
        <div className="text-[11px] font-black text-white flex-1">@you</div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[13px] font-black font-mono text-white">+42</span>
          <Image src="/sol.png" alt="SOL" width={11} height={11} className="h-[11px] w-auto" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#999] mt-3">
        <span className="text-[#22c55e] animate-[arrowBounce_1s_ease-in-out_infinite]">↑</span>
        Climbed 12 spots this week
      </div>
    </div>
  );
}

// ─── Screen 4: Cup — VS Matchup + PnL Bars ──────────────────

function ScreenCup() {
  const [bar1, setBar1] = useState(0);
  const [bar2, setBar2] = useState(0);
  useEffect(() => {
    setBar1(0); setBar2(0);
    const t = setTimeout(() => { setBar1(78); setBar2(54); }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] tracking-[3px] font-mono cut-xs" style={{ color: '#FFD700', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        TRENCHER CUP — QF
      </div>
      <div className="flex items-center gap-5">
        <div className="text-center">
          <div className="w-[52px] h-[52px] rounded-full mx-auto mb-2 flex items-center justify-center text-[18px] font-black" style={{ background: 'linear-gradient(135deg, #eee, #aaa)', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 0 16px rgba(255,255,255,0.1)', color: '#0a0a12' }}>Y</div>
          <div className="text-[12px] font-black text-white">@you</div>
          <div className="text-[15px] font-black font-mono text-white mt-1">+142</div>
        </div>
        <div className="text-[28px] font-black animate-[vsGlow_2s_ease-in-out_infinite]" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>VS</div>
        <div className="text-center">
          <div className="w-[52px] h-[52px] rounded-full mx-auto mb-2 flex items-center justify-center text-[18px] font-black" style={{ background: 'linear-gradient(135deg, #555, #333)', border: '2px solid rgba(255,255,255,0.1)', color: '#888' }}>R</div>
          <div className="text-[12px] font-bold text-[#777]">@rival</div>
          <div className="text-[15px] font-black font-mono text-[#555] mt-1">+98</div>
        </div>
      </div>
      <div className="w-full max-w-[280px] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-white w-[40px] text-right">@you</span>
          <div className="flex-1 h-[6px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full transition-all duration-[2s] ease-out" style={{ width: `${bar1}%`, background: 'linear-gradient(90deg, #ddd, #fff)', boxShadow: '0 0 6px rgba(255,255,255,0.15)' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#555] w-[40px] text-right">@rival</span>
          <div className="flex-1 h-[6px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full transition-all duration-[2s] ease-out" style={{ width: `${bar2}%`, background: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      </div>
      <div className="text-[12px] font-black tracking-[2px] text-white animate-[statusPulse_1.5s_ease-in-out_infinite]">
        ADVANCING TO SEMIFINALS
      </div>
    </div>
  );
}

// ─── Screen 5: Vault — The Chest ────────────────────────────

function ScreenVault() {
  const [vault, setVault] = useState(127);
  useEffect(() => {
    const iv = setInterval(() => setVault(v => v + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      {/* Chest image with glow */}
      <div className="relative">
        <div className="absolute inset-0 animate-[chestGlow_3s_ease-in-out_infinite] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)', filter: 'blur(20px)' }} />
        <Image src="/chest.png" alt="Vault" width={220} height={180} className="relative z-10 drop-shadow-[0_0_16px_rgba(255,255,255,0.1)]" style={{ objectFit: 'contain' }} />
      </div>

      {/* Vault total */}
      <div className="flex items-center gap-2">
        <span className="text-[30px] font-black font-mono text-white" style={{ textShadow: '0 0 16px rgba(255,255,255,0.15)' }}>{vault}</span>
        <Image src="/sol.png" alt="SOL" width={22} height={22} className="h-[22px] w-auto" />
      </div>
      <div className="text-[10px] font-bold font-mono text-[#999]">69% of every $WEB3ME trade</div>

      {/* Weekly share card */}
      <div className="w-full max-w-[280px] cut-xs overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[8px] tracking-[2px] text-[#666] font-mono">YOUR WEEKLY SHARE · RANK #7</span>
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[20px] font-black font-mono flex items-center gap-1.5 text-white">
              +4 <Image src="/sol.png" alt="SOL" width={14} height={14} className="h-3.5 w-auto" />
            </div>
            <div className="text-[9px] text-[#555] mt-0.5">Sent every Sunday</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[#555]">Lifetime</div>
            <div className="text-[14px] font-black font-mono flex items-center gap-1 text-white">+31 <Image src="/sol.png" alt="SOL" width={12} height={12} className="h-3 w-auto" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SCREENS = [ScreenSignIn, ScreenWallets, ScreenRank, ScreenCup, ScreenVault];

// ─── Main ────────────────────────────────────────────────────

export function JourneySection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setActive(a => (a + 1) % STEPS.length), CYCLE_MS);
    return () => clearInterval(iv);
  }, []);

  const ActiveScreen = SCREENS[active];

  return (
    <section className="max-w-[780px] mx-auto px-6 sm:px-12 lg:px-16 py-16">
      <div className="text-center mb-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">Your <span className="text-[var(--trench-accent)]">journey</span></h2>
        <p className="text-[12px] text-[var(--trench-text-muted)] mt-1">From sign-up to earning rewards</p>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:min-h-[420px] gap-6 lg:gap-0">
        {/* LEFT: Timeline */}
        <div className="w-full lg:w-[260px] flex-shrink-0 relative">
          <div className="absolute top-5 bottom-5 left-[16px] w-[2px]">
            <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="absolute top-0 left-0 right-0 transition-all duration-700 ease-out" style={{
              height: `${((active + 0.5) / STEPS.length) * 100}%`,
              background: 'linear-gradient(180deg, #00D4FF, rgba(0,212,255,0.3))',
              boxShadow: '0 0 8px rgba(0,212,255,0.2)',
            }} />
          </div>
          <div className="flex flex-col">
            {STEPS.map((step, i) => {
              const isDone = i < active;
              const isActive = i === active;
              return (
                <button key={i} onClick={() => setActive(i)} className="group flex items-start gap-3.5 py-3 relative z-[1] text-left transition-all cursor-pointer">
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 transition-all duration-300 group-hover:scale-[1.2]" style={{
                    background: isActive ? '#00D4FF' : isDone ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
                    backdropFilter: isDone ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: isDone ? 'blur(12px)' : 'none',
                    color: isActive ? 'black' : isDone ? '#00D4FF' : '#555',
                    boxShadow: isActive ? '0 0 24px rgba(0,212,255,0.5)' : isDone ? '0 0 12px rgba(0,212,255,0.15)' : 'none',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    border: isDone ? '1px solid rgba(0,212,255,0.2)' : !isActive ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div className="pt-1.5">
                    <div className="text-[12px] font-extrabold mb-0.5 transition-colors" style={{ color: isActive ? '#00D4FF' : isDone ? 'rgba(0,212,255,0.5)' : '#666' }}>{step.title}</div>
                    <div className="text-[9px] leading-relaxed max-w-[180px] transition-colors" style={{ color: isActive ? '#888' : isDone ? '#555' : '#444' }}>{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEPARATOR — desktop only */}
        <div className="hidden lg:block w-px flex-shrink-0 mx-5" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)' }} />

        {/* RIGHT: Glass card */}
        <div className="flex-1 min-w-0">
          <GlassCard cut={12} bg="rgba(8,12,18,0.65)">
            <div className="relative min-h-[420px]">
              <div className="absolute top-0 left-0 right-0 h-[1px] z-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
              <div className="absolute top-4 left-5 text-[8px] tracking-[3px] font-mono z-10" style={{ color: 'rgba(255,255,255,0.25)' }}>
                STEP {active + 1} — {STEPS[active].label}
              </div>
              <div className="absolute top-0 right-0 w-[200px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />
              <div className="px-10 pt-14 pb-10 h-full min-h-[420px] flex items-center justify-center">
                <div key={active} className="w-full h-full animate-[screenIn_0.5s_ease-out]">
                  <ActiveScreen />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ringPulse { 0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); } 50% { box-shadow: 0 0 24px rgba(255,255,255,0.15), 0 0 48px rgba(255,255,255,0.05); } }
        @keyframes typeIn { 0%, 100% { width: 0; opacity: 0; } 10% { opacity: 1; } 20%, 80% { width: 100%; opacity: 1; } 90% { opacity: 0; } }
        @keyframes arrowBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanLine { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes youPulse { 0%, 100% { border-color: rgba(255,255,255,0.08); } 50% { border-color: rgba(255,255,255,0.18); box-shadow: 0 0 12px rgba(255,255,255,0.04); } }
        @keyframes vsGlow { 0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.2); } 50% { text-shadow: 0 0 40px rgba(255,215,0,0.5); } }
        @keyframes statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes podiumShimmer { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes chestGlow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes screenIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}
