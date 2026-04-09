'use client';

import dynamic from 'next/dynamic';

const SynapticShift = dynamic(() => import('@/components/react-bits/synaptic-shift'), { ssr: false });

export function SynapticBackgroundLayer() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: '#050508' }}>
      <SynapticShift
        speed={0.5}
        scale={0.9}
        intensity={3}
        color="#00D4FA"
        falloff={1.36}
        complexity={10}
        breathing={false}
        className="h-full w-full opacity-90"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(0, 212, 250, 0.14) 0%, rgba(0, 212, 250, 0.04) 24%, transparent 52%), linear-gradient(180deg, rgba(5,5,8,0.16) 0%, rgba(5,5,8,0.34) 100%)',
        }}
      />
    </div>
  );
}
