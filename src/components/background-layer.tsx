'use client';

import dynamic from 'next/dynamic';

const Lightspeed = dynamic(() => import('@/components/lightspeed'), { ssr: false });

export function BackgroundLayer() {
  return (
    <div className="fixed inset-0" style={{ zIndex: 0, background: '#050508' }}>
      <Lightspeed
        primaryColor="#00D4FF"
        secondaryColor="#0066AA"
        tertiaryColor="#00A3CC"
        speed={0.7}
        streakCount={140}
        stretchFactor={0.045}
        intensity={1.1}
        fadePower={2.0}
        opacity={1.0}
        quality="medium"
        interactionEnabled={true}
      />
    </div>
  );
}
