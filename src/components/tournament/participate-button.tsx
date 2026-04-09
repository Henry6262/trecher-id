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
  const { ready, authenticated, login } = usePrivy();

  function handleClick() {
    if (ready && authenticated) {
      router.push('/dashboard');
      return;
    }

    if (ready) {
      login();
      return;
    }

    router.push('/?auth=1&participate=1&next=%2Fdashboard');
  }

  return (
    <CutButton onClick={handleClick} size={size} className={className}>
      Participate
    </CutButton>
  );
}
