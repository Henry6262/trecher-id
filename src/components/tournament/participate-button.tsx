'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { CutButton } from '@/components/cut-button';

interface ParticipateButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ParticipateButton({ className, size = 'lg' }: ParticipateButtonProps) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  function handleClick() {
    if (ready && authenticated) {
      router.push('/dashboard');
      return;
    }

    router.push('/login?participate=1');
  }

  return (
    <CutButton onClick={handleClick} size={size} className={className}>
      Participate
    </CutButton>
  );
}
