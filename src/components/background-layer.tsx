'use client';

import dynamic from 'next/dynamic';

const RisingLines = dynamic(() => import('@/components/rising-lines'), { ssr: false });

export function BackgroundLayer() {
  return (
    <div className="fixed inset-0" style={{ zIndex: 0, background: '#050508' }}>
      <RisingLines
        color="#00D4FF"
        horizonColor="#00D4FF"
        haloColor="#33DDFF"
        riseSpeed={0.08}
        riseScale={10.0}
        riseIntensity={1.3}
        flowSpeed={0.15}
        flowDensity={4.0}
        flowIntensity={0.7}
        horizonIntensity={0.9}
        haloIntensity={7.5}
        horizonHeight={-0.85}
        circleScale={-0.5}
        scale={6.5}
        brightness={1.1}
      />
    </div>
  );
}
