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
    <div className="fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,5,8,0.60) 15%, rgba(5,5,8,0.85) 55%, rgba(5,5,8,0.95) 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-40">
        <RisingLines
          color="#FF6B00"
          horizonColor="#FF6B00"
          haloColor="#FF8C33"
          riseSpeed={0.04}
          riseScale={1.0}
          riseIntensity={0.6}
          flowSpeed={0.3}
          flowDensity={0.4}
          flowIntensity={0.3}
          horizonIntensity={0.8}
          haloIntensity={0.4}
          horizonHeight={-0.5}
          scale={1.0}
          brightness={1.0}
        />
      </div>
    </div>
  );
}
