'use client';

import dynamic from 'next/dynamic';

const FaultyTerminal = dynamic(
  () => import('@/components/react-bits/faulty-terminal/FaultyTerminal'),
  { ssr: false }
);

export function SynapticBackgroundLayer() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: '#050508' }}>
      <FaultyTerminal
        scale={1.5}
        gridMul={[2, 1]}
        digitSize={1.2}
        timeScale={0.3}
        scanlineIntensity={0.3}
        glitchAmount={1}
        flickerAmount={1}
        noiseAmp={0}
        chromaticAberration={0}
        curvature={0}
        tint="#00D4FA"
        mouseReact={true}
        mouseStrength={0.3}
        pageLoadAnimation={false}
        brightness={0.15}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(0, 212, 250, 0.12) 0%, rgba(0, 212, 250, 0.03) 24%, transparent 52%), linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(5,5,8,0.4) 100%)',
        }}
      />
    </div>
  );
}
