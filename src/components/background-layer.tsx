'use client';

export function BackgroundLayer() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: '#050508' }}>
      {/* Horizon glow */}
      <div className="absolute inset-0 bg-gradient-radial" />

      {/* Animated CSS particles — always visible */}
      <div className="bg-particles" />
      <div className="bg-particles-slow" />

      {/* Vertical glow lines */}
      <div className="bg-lines" />

      {/* Vignette — darkens edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,5,8,0.35) 0%, rgba(5,5,8,0.8) 65%, rgba(5,5,8,0.97) 100%)',
        }}
      />
    </div>
  );
}
