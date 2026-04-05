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

const CYCLE_MS = 5500;

// ─── Screen 1: Sign In — Profile Creation Flow ──────────────

function ScreenSignIn() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      <div className="w-[80px] h-[80px] rounded-full p-[3px] animate-[ringPulse_3s_ease-in-out_infinite]" style={{ background: 'linear-gradient(135deg, #1DA1F2, #00D4FF)' }}>
        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#0a0a12' }}>
          <span className="text-[28px]">𝕏</span>
        </div>
      </div>
      <div className="flex items-center w-full max-w-[300px]">
        <div className="px-3 py-2.5 text-[12px] text-[#555] cut-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRight: 'none' }}>
          web3me.fun/
        </div>
        <div className="px-3 py-2.5 text-[14px] font-bold text-[var(--trench-accent)] flex-1 font-mono cut-xs overflow-hidden" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <span className="animate-[typeIn_3s_steps(12)_infinite]">yourusername</span>
        </div>
      </div>
      <div className="text-[18px] text-[rgba(0,212,255,0.3)] animate-[arrowBounce_1.5s_ease-in-out_infinite]">↓</div>
      <div className="flex items-center gap-3 w-full max-w-[300px] px-4 py-3 cut-sm animate-[fadeUp_0.5s_ease-out_1.5s_both]" style={{ background: 'rgba(8,12,22,0.8)', border: '1px solid rgba(0,212,255,0.08)' }}>
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1DA1F2, #00D4FF)' }} />
        <div className="flex-1">
          <div className="text-[13px] font-black">@yourusername</div>
          <div className="text-[9px] text-[var(--trench-accent)]">web3me.fun/yourusername</div>
        </div>
        <span className="text-[16px] text-[var(--trench-accent)]">✓</span>
      </div>
    </div>
  );
}

// ─── Screen 2: Wallets — Orb with orbiting tokens ───────────

function ScreenWallets() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative w-[180px] h-[180px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[56px] h-[56px] rounded-full flex items-center justify-center animate-[orbBreathe_3s_ease-in-out_infinite]" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))', border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 0 30px rgba(0,212,255,0.15)' }}>
          <span className="text-[24px]">👛</span>
        </div>
        {['🟣', '🟢', '🔵', '🟡', '🔴'].map((emoji, i) => (
          <div key={i} className="absolute top-1/2 left-1/2 w-[20px] h-[20px] rounded-full flex items-center justify-center text-[12px]" style={{ animation: `orbit ${4 + i * 0.5}s linear infinite`, animationDelay: `${-i * 0.8}s` }}>
            {emoji}
          </div>
        ))}
      </div>
      <div className="text-[14px] font-extrabold text-center">Indexing your wallets</div>
      <div className="text-[11px] text-[#555] text-center">Every swap on Solana, tracked and verified</div>
      <div className="flex gap-3 mt-2">
        {[{ val: '847', label: 'TRADES' }, { val: '142', label: 'TOKENS' }, { val: '+68', label: 'PNL' }].map(s => (
          <div key={s.label} className="text-center px-4 py-2 cut-xs" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.06)' }}>
            <div className="text-[16px] font-black font-mono text-[var(--trench-accent)]">{s.val}</div>
            <div className="text-[7px] tracking-[1px] text-[#555] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen 3: Rank — Podium + Your Spot ─────────────────────

function ScreenRank() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="flex items-end gap-2">
        {[
          { rank: '2ND', color: '#C0C0C0', border: 'rgba(192,192,192,0.15)', name: '@blknoiz', pnl: '+98', h: '70px', avSize: 6 },
          { rank: '1ST', color: '#FFD700', border: 'rgba(255,215,0,0.2)', name: '@ansem', pnl: '+142', h: '90px', avSize: 7 },
          { rank: '3RD', color: '#CD7F32', border: 'rgba(205,127,50,0.15)', name: '@cryptowiz', pnl: '+76', h: '60px', avSize: 6 },
        ].map(p => (
          <div key={p.rank} className="text-center px-3 py-2 cut-xs flex flex-col justify-end" style={{ background: 'rgba(8,12,22,0.6)', border: `1px solid ${p.border}`, minHeight: p.h }}>
            <div className="text-[9px] font-black tracking-[2px] mb-1" style={{ color: p.color }}>{p.rank}</div>
            <div className={`w-${p.avSize} h-${p.avSize} rounded-full mx-auto mb-1`} style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)`, width: p.avSize * 4, height: p.avSize * 4 }} />
            <div className="text-[8px]" style={{ color: p.color === '#FFD700' ? '#ccc' : '#888' }}>{p.name}</div>
            <div className="text-[11px] font-black font-mono text-[var(--trench-accent)] mt-1">{p.pnl}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 w-full max-w-[300px] px-4 py-3 cut-xs animate-[youPulse_2.5s_ease-in-out_infinite]" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <span className="text-[18px] font-black font-mono text-[var(--trench-accent)]">#7</span>
        <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1DA1F2, #00D4FF)', border: '2px solid rgba(0,212,255,0.3)' }} />
        <div className="flex-1">
          <div className="text-[12px] font-black text-[var(--trench-accent)]">@you</div>
          <div className="text-[9px] text-[#555]">71% WR · 847 trades</div>
        </div>
        <span className="text-[16px] font-black font-mono text-[var(--trench-accent)]">+42</span>
      </div>
      <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--trench-accent)]">
        <span className="animate-[arrowBounce_1s_ease-in-out_infinite]">↑</span>
        Climbing — 12 positions this week
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
          <div className="w-[52px] h-[52px] rounded-full mx-auto mb-2 flex items-center justify-center text-[18px] font-black" style={{ background: 'linear-gradient(135deg, #00D4FF, #0099cc)', border: '2px solid rgba(0,212,255,0.4)', boxShadow: '0 0 20px rgba(0,212,255,0.3)', color: 'black' }}>Y</div>
          <div className="text-[12px] font-black text-[var(--trench-accent)]">@you</div>
          <div className="text-[15px] font-black font-mono text-[var(--trench-accent)] mt-1">+142</div>
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
          <span className="text-[9px] font-mono text-[var(--trench-accent)] w-[40px] text-right">@you</span>
          <div className="flex-1 h-[6px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full transition-all duration-[2s] ease-out" style={{ width: `${bar1}%`, background: 'linear-gradient(90deg, #00D4FF, #33DDFF)', boxShadow: '0 0 8px rgba(0,212,255,0.3)' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#555] w-[40px] text-right">@rival</span>
          <div className="flex-1 h-[6px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full transition-all duration-[2s] ease-out" style={{ width: `${bar2}%`, background: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      </div>
      <div className="text-[12px] font-black tracking-[2px] text-[var(--trench-accent)] animate-[statusPulse_1.5s_ease-in-out_infinite]">
        ADVANCING TO SEMIFINALS
      </div>
    </div>
  );
}

// ─── Screen 5: Vault — Treasure Chest ────────────────────────

function ScreenVault() {
  const [vault, setVault] = useState(127);
  useEffect(() => {
    const iv = setInterval(() => setVault(v => v + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const coins = [
    { top: '5px', left: '15%', tx: '80px', ty: '110px', delay: '0.3s' },
    { top: '15px', left: '75%', tx: '-60px', ty: '100px', delay: '0.9s' },
    { top: '0', left: '45%', tx: '5px', ty: '120px', delay: '1.5s' },
    { top: '20px', left: '25%', tx: '55px', ty: '95px', delay: '2.1s' },
    { top: '8px', left: '65%', tx: '-40px', ty: '110px', delay: '2.7s' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="relative w-[200px] h-[160px]">
        {coins.map((c, i) => (
          <div key={i} className="absolute w-[14px] h-[14px] rounded-full" style={{
            background: 'linear-gradient(135deg, #9945FF, #14F195)',
            boxShadow: '0 0 6px rgba(153,69,255,0.3)',
            top: c.top, left: c.left, opacity: 0,
            animation: 'flyCoin 2s ease-in forwards',
            animationDelay: c.delay,
            '--tx': c.tx, '--ty': c.ty,
          } as React.CSSProperties} />
        ))}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130px]">
          <div className="w-full h-[32px] animate-[lidBounce_4s_ease-in-out_infinite]" style={{
            background: 'linear-gradient(180deg, #4a3a15, #3a2a0a)',
            border: '2px solid rgba(255,215,0,0.3)', borderBottom: 'none',
            clipPath: 'polygon(0 30%, 6px 0, calc(100% - 6px) 0, 100% 30%, 100% 100%, 0 100%)',
            transformOrigin: 'bottom center',
          }} />
          <div className="absolute bottom-[46px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full z-10" style={{ background: '#FFD700', boxShadow: '0 0 10px rgba(255,215,0,0.4)' }} />
          <div className="w-full h-[55px] relative overflow-hidden cut-sm" style={{ background: 'linear-gradient(180deg, #3a2a0a, #2a1a05)', border: '2px solid rgba(255,215,0,0.3)' }}>
            <div className="absolute inset-0 animate-[chestGlow_3s_ease-in-out_infinite]" style={{ background: 'linear-gradient(180deg, rgba(255,215,0,0.15), rgba(255,215,0,0.03))' }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[32px] font-black font-mono" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>{vault}</span>
        <Image src="/sol.png" alt="SOL" width={22} height={22} className="h-[22px] w-auto" />
      </div>
      <div className="text-[11px] font-bold font-mono" style={{ color: '#FFD700' }}>69% of every $WEB3ME trade</div>
      <div className="w-full max-w-[260px] px-5 py-3 cut-xs text-center mt-1" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
        <div className="text-[8px] tracking-[2px] text-[#777] font-mono mb-1">YOUR WEEKLY SHARE (#7)</div>
        <div className="text-[22px] font-black font-mono flex items-center justify-center gap-2 text-[var(--trench-accent)]">
          +4 <Image src="/sol.png" alt="SOL" width={16} height={16} className="h-4 w-auto" />
        </div>
        <div className="text-[9px] text-[#555] mt-1">Sent to your wallet every Sunday</div>
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Your <span className="text-[var(--trench-accent)]">journey</span></h2>
        <p className="text-[12px] text-[var(--trench-text-muted)] mt-1">From sign-up to earning rewards</p>
      </div>

      <div className="flex items-stretch min-h-[420px]">
        {/* LEFT: Timeline */}
        <div className="w-[260px] flex-shrink-0 relative">
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
                <button key={i} onClick={() => setActive(i)} className="flex items-start gap-3.5 py-3 relative z-[1] text-left transition-all">
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 transition-all duration-400" style={{
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

        {/* SEPARATOR */}
        <div className="w-px flex-shrink-0 mx-5" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.12) 20%, rgba(0,212,255,0.12) 80%, transparent 100%)' }} />

        {/* RIGHT: Glass card */}
        <div className="flex-1 min-w-0">
          <GlassCard cut={12} bg="rgba(8,12,18,0.65)">
            <div className="relative min-h-[420px]">
              <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)', opacity: 0.4 }} />
              <div className="absolute top-4 left-5 text-[8px] tracking-[3px] font-mono z-10" style={{ color: 'rgba(0,212,255,0.5)' }}>
                STEP {active + 1} — {STEPS[active].label}
              </div>
              <div className="absolute top-0 right-0 w-[200px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)' }} />
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
        @keyframes ringPulse { 0%, 100% { box-shadow: 0 0 0 rgba(0,212,255,0); } 50% { box-shadow: 0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1); } }
        @keyframes typeIn { 0%, 100% { width: 0; opacity: 0; } 10% { opacity: 1; } 20%, 80% { width: 100%; opacity: 1; } 90% { opacity: 0; } }
        @keyframes arrowBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes orbBreathe { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.06); } }
        @keyframes orbit { from { transform: rotate(0deg) translateX(70px) rotate(0deg); } to { transform: rotate(360deg) translateX(70px) rotate(-360deg); } }
        @keyframes youPulse { 0%, 100% { border-color: rgba(0,212,255,0.15); } 50% { border-color: rgba(0,212,255,0.35); box-shadow: 0 0 16px rgba(0,212,255,0.08); } }
        @keyframes vsGlow { 0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.2); } 50% { text-shadow: 0 0 40px rgba(255,215,0,0.5); } }
        @keyframes statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes flyCoin { 0% { opacity: 1; transform: translate(0, 0) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3); } }
        @keyframes lidBounce { 0%, 70%, 100% { transform: rotateX(0deg); } 10%, 20% { transform: rotateX(-15deg); } }
        @keyframes chestGlow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes screenIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}
