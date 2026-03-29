'use client';

import dynamic from 'next/dynamic';
import type { RisingLinesProps } from '@/components/rising-lines';
import type { ComponentType } from 'react';

const RisingLines = dynamic<RisingLinesProps>(
  () => import('@/components/rising-lines').then(m => {
    const Component = (m as Record<string, unknown>).RisingLines || m.default;
    return { default: Component as ComponentType<RisingLinesProps> };
  }),
  { ssr: false }
);

export function BackgroundLayer() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: '#050508' }}>
      {/* RisingLines — subtle orange particles */}
      <div className="absolute inset-0 opacity-30">
        <RisingLines
          color="#FF6B00"
          horizonColor="#FF6B00"
          haloColor="#FF8C33"
          riseSpeed={0.03}
          riseScale={1.2}
          riseIntensity={0.4}
          flowSpeed={0.2}
          flowDensity={0.3}
          flowIntensity={0.2}
          horizonIntensity={0.3}
          haloIntensity={0.2}
          horizonHeight={-0.8}
          scale={1.0}
          brightness={0.8}
        />
      </div>
      {/* Vignette overlay — darkens edges, keeps center readable */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,5,8,0.4) 0%, rgba(5,5,8,0.85) 70%, rgba(5,5,8,0.98) 100%)',
        }}
      />
    </div>
  );
}
