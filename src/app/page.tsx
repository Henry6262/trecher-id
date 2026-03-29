import { BackgroundLayer } from '@/components/background-layer';
import { CutButton } from '@/components/cut-button';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <BackgroundLayer />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-5xl sm:text-6xl font-mono font-bold text-[var(--trench-orange)] mb-4 tracking-tight">
          TRENCH ID
        </h1>
        <p className="text-base text-[var(--trench-text-muted)] max-w-md mb-8 leading-relaxed">
          Your Web3 bio link. Custom links. Verified on-chain trading performance. One shareable URL.
        </p>
        <CutButton href="/login" size="lg">
          Create Your Trench ID
        </CutButton>
        <p className="text-[10px] text-[var(--trench-text-muted)] mt-6 tracking-wide">
          SIGN IN WITH X &middot; LINK WALLETS &middot; SHARE YOUR LINK
        </p>
      </div>
    </div>
  );
}
