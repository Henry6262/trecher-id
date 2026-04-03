import Link from 'next/link';
import Image from 'next/image';
import { BackgroundLayer } from '@/components/background-layer';
import { CutButton } from '@/components/cut-button';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
      <BackgroundLayer />
      <div className="relative z-10 text-center px-6 max-w-md">
        <Link href="/" className="inline-block mb-8">
          <Image src="/logo.png" alt="Web3Me" width={160} height={40} className="h-8 w-auto mx-auto opacity-50" />
        </Link>
        <p className="text-[80px] font-black font-mono text-[#00D4FF] leading-none mb-2" style={{ textShadow: '0 0 40px rgba(0,212,255,0.2)' }}>
          404
        </p>
        <p className="text-sm font-mono text-[var(--trench-text-muted)] mb-6">
          This trader doesn&apos;t exist yet.
        </p>
        <CutButton href="/" variant="secondary" size="sm">
          ← Back to Web3Me
        </CutButton>
      </div>
    </div>
  );
}
