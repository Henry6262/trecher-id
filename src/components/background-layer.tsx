'use client';

import { useEffect, useState } from 'react';

function RisingLinesWrapper() {
  const [Component, setComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    import('@/components/rising-lines').then((m) => {
      const C = (m as Record<string, unknown>).RisingLines || m.default;
      setComponent(() => C as React.ComponentType<Record<string, unknown>>);
    });
  }, []);

  if (!Component) return null;

  return (
    <Component
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
  );
}

export function BackgroundLayer() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: '#050508' }}>
      {/* CSS fallback — always visible */}
      <div className="absolute inset-0 bg-gradient-radial" />

      {/* Three.js enhancement — loads after hydration */}
      <div className="absolute inset-0 opacity-30">
        <RisingLinesWrapper />
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,5,8,0.4) 0%, rgba(5,5,8,0.85) 70%, rgba(5,5,8,0.98) 100%)',
        }}
      />
    </div>
  );
}
