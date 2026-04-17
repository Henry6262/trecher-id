'use client';

export function SynapticBackgroundLayer() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: '#050508' }}>
      {/* CSS-only grid — avoids dual WebGL context conflict with Lanyard canvas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,250,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,250,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(0,212,250,0.12) 0%, rgba(0,212,250,0.03) 24%, transparent 52%), linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(5,5,8,0.4) 100%)',
        }}
      />
    </div>
  );
}
