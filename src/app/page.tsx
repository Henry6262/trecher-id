import { BackgroundLayer } from '@/components/background-layer';
import { CutButton } from '@/components/cut-button';
import { CutCorner } from '@/components/cut-corner';
import { Check, Link2, BarChart3, Wallet } from 'lucide-react';

const FEATURES = [
  {
    icon: Link2,
    title: 'Custom Links',
    desc: 'Add any link — courses, socials, projects, tip jar. Fully customizable.',
  },
  {
    icon: BarChart3,
    title: 'Verified Trades',
    desc: 'On-chain PnL, win rate, and pinned trades auto-fetched from your wallets.',
  },
  {
    icon: Wallet,
    title: 'Wallet Proof',
    desc: 'Link Solana wallets via Privy. Verified on-chain, no faking it.',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <BackgroundLayer />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4">
        {/* Nav */}
        <nav className="w-full max-w-[560px] flex items-center justify-between py-6">
          <span className="font-mono font-bold text-sm tracking-[3px] text-[var(--trench-orange)]">
            TRENCH ID
          </span>
          <CutButton href="/login" variant="secondary" size="sm">
            Sign in
          </CutButton>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[560px] -mt-16">
          {/* Badge */}
          <div className="cut-xs inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-[10px] font-mono tracking-[2px] text-[var(--trench-orange)] bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.12)]">
            <Check size={10} strokeWidth={3} />
            ON-CHAIN VERIFIED
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-mono font-bold text-[var(--trench-text)] mb-4 tracking-tight leading-[0.95]">
            Your Web3
            <br />
            <span className="text-[var(--trench-orange)]">Bio Link</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--trench-text-muted)] max-w-sm mb-8 leading-relaxed">
            Like Linktree, but for traders. Custom links backed by
            verified on-chain trading performance.
          </p>

          <CutButton href="/login" size="lg">
            Create Your Trench ID
          </CutButton>

          <p className="text-[9px] text-[var(--trench-text-muted)] mt-4 tracking-[2px] font-mono">
            FREE &middot; SIGN IN WITH X &middot; 30 SECONDS
          </p>
        </div>

        {/* Features */}
        <div className="w-full max-w-[560px] grid grid-cols-1 sm:grid-cols-3 gap-3 pb-16 mt-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <CutCorner
              key={title}
              cut="sm"
              bg="rgba(255,255,255,0.02)"
              borderColor="rgba(255,107,0,0.08)"
            >
              <div className="p-4">
                <Icon size={16} className="text-[var(--trench-orange)] mb-2" />
                <h3 className="text-xs font-mono font-bold text-[var(--trench-text)] mb-1">{title}</h3>
                <p className="text-[10px] text-[var(--trench-text-muted)] leading-relaxed">{desc}</p>
              </div>
            </CutCorner>
          ))}
        </div>

        {/* Footer */}
        <div className="w-full max-w-[560px] border-t border-[var(--trench-border-subtle)] py-6 text-center">
          <span className="text-[9px] text-[var(--trench-text-muted)] font-mono tracking-[2px]">
            TRENCH ID &middot; SOLANA &middot; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
