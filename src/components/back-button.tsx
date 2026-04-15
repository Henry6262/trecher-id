'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="group inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[1.5px] text-[var(--trench-text-muted)] transition-colors hover:text-[var(--trench-accent)]"
    >
      <ArrowLeft
        size={12}
        className="transition-transform group-hover:-translate-x-0.5"
      />
      BACK
    </button>
  );
}
