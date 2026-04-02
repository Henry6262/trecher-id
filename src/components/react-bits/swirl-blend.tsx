"use client";

import React, { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import * as THREE from "three";

export interface SwirlBlendProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Content rendered above the effect */
  children?: React.ReactNode;
  /** Animation speed multiplier */
  speed?: number;
  /** Pattern tile scale */
  scale?: number;
  /** Number of distortion iterations */
  iterations?: number;
  /** Cosine warp frequency */
  cosFrequency?: number;
  /** Cosine warp amplitude */
  cosAmplitude?: number;
  /** Sine warp amplitude */
  sinAmplitude?: number;
  /** Secondary sine modulation rate */
  modulationRate?: number;
  /** Secondary sine modulation depth */
  modulationDepth?: number;
  /** Palette base R */
  paletteBaseR?: number;
  /** Palette base G */
  paletteBaseG?: number;
  /** Palette base B */
  paletteBaseB?: number;
  /** Palette amplitude R */
  paletteAmpR?: number;
  /** Palette amplitude G */
  paletteAmpG?: number;
  /** Palette amplitude B */
  paletteAmpB?: number;
  /** Palette phase R */
  palettePhaseR?: number;
  /** Palette phase G */
  palettePhaseG?: number;
  /** Palette phase B */
  palettePhaseB?: number;
  /** Output divisor controlling final brightness */
  outputScale?: number;
  /** Background color in hex */
  backgroundColor?: string;
  /** Master opacity */
  opacity?: number;
  /** Enable cursor interaction to intensify distortion near pointer */
  cursorInteraction?: boolean;
  /** Cursor effect strength multiplier (0–3) */
  cursorIntensity?: number;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uScale;
uniform int uIter;
uniform float uCosFreq;
uniform float uCosAmp;
uniform float uSinAmp;
uniform float uModRate;
uniform float uModDepth;
uniform vec3 uPalBase;
uniform vec3 uPalAmp;
uniform vec3 uPalPhase;
uniform float uOutScale;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

const float TAU = 6.2831853;
const float HALF_PI = 1.5707963;

vec3 palette(float t, vec3 base, vec3 amp, vec3 phase) {
  return base + amp * cos(TAU * (t + phase));
}

void main() {
  vec2 st = vUv * uScale;
  float t = uTime * uSpeed;

  vec2 pointerUv = uPointer * uScale;
  float cursorDist = length(st - pointerUv);
  float cursorInfluence = smoothstep(4.0, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localCosAmp = uCosAmp + cursorInfluence * 0.12;
  float localSinAmp = uSinAmp + cursorInfluence * 0.15;
  float localModDepth = uModDepth + cursorInfluence * 0.8;

  for (int i = 0; i < 10; i++) {
    if (i >= uIter) break;
    st += cos(st.yx * uCosFreq + vec2(t, HALF_PI)) * localCosAmp;
    st += sin(st.yx + t + vec2(HALF_PI, sin(uModRate * t + st.x * localModDepth))) * localSinAmp;
  }

  st /= uOutScale;

  vec3 col = palette(st.x, uPalBase, uPalAmp, uPalPhase);

  col += cursorInfluence * 0.03;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 result = mix(uBg, col, clamp(lum * 4.0, 0.0, 1.0));

  gl_FragColor = vec4(result, uAlpha);
}
`;

function parseHexColor(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [0, 0, 0];
  return [
    parseInt(match[1], 16) / 255,
    parseInt(match[2], 16) / 255,
    parseInt(match[3], 16) / 255,
  ];
}

interface BlendSceneProps {
  speed: number;
  scale: number;
  iterations: number;
  cosFrequency: number;
  cosAmplitude: number;
  sinAmplitude: number;
  modulationRate: number;
  modulationDepth: number;
  paletteBaseR: number;
  paletteBaseG: number;
  paletteBaseB: number;
  paletteAmpR: number;
  paletteAmpG: number;
  paletteAmpB: number;
  palettePhaseR: number;
  palettePhaseG: number;
  palettePhaseB: number;
  outputScale: number;
  bgRgb: [number, number, number];
  opacity: number;
  pointer: [number, number];
  cursorInteraction: boolean;
  cursorIntensity: number;
}

const BlendScene: React.FC<BlendSceneProps> = ({
  speed,
  scale,
  iterations,
  cosFrequency,
  cosAmplitude,
  sinAmplitude,
  modulationRate,
  modulationDepth,
  paletteBaseR,
  paletteBaseG,
  paletteBaseB,
  paletteAmpR,
  paletteAmpG,
  paletteAmpB,
  palettePhaseR,
  palettePhaseG,
  palettePhaseB,
  outputScale,
  bgRgb,
  opacity,
  pointer,
  cursorInteraction,
  cursorIntensity,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uIter: { value: iterations },
      uCosFreq: { value: cosFrequency },
      uCosAmp: { value: cosAmplitude },
      uSinAmp: { value: sinAmplitude },
      uModRate: { value: modulationRate },
      uModDepth: { value: modulationDepth },
      uPalBase: {
        value: new THREE.Vector3(paletteBaseR, paletteBaseG, paletteBaseB),
      },
      uPalAmp: {
        value: new THREE.Vector3(paletteAmpR, paletteAmpG, paletteAmpB),
      },
      uPalPhase: {
        value: new THREE.Vector3(palettePhaseR, palettePhaseG, palettePhaseB),
      },
      uOutScale: { value: outputScale },
      uBg: { value: new THREE.Vector3(...bgRgb) },
      uAlpha: { value: opacity },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uCursorActive: { value: 0 },
      uCursorIntensity: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uRes.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
    );
    mat.uniforms.uSpeed.value = speed;
    mat.uniforms.uScale.value = scale;
    mat.uniforms.uIter.value = iterations;
    mat.uniforms.uCosFreq.value = cosFrequency;
    mat.uniforms.uCosAmp.value = cosAmplitude;
    mat.uniforms.uSinAmp.value = sinAmplitude;
    mat.uniforms.uModRate.value = modulationRate;
    mat.uniforms.uModDepth.value = modulationDepth;
    mat.uniforms.uPalBase.value.set(paletteBaseR, paletteBaseG, paletteBaseB);
    mat.uniforms.uPalAmp.value.set(paletteAmpR, paletteAmpG, paletteAmpB);
    mat.uniforms.uPalPhase.value.set(
      palettePhaseR,
      palettePhaseG,
      palettePhaseB,
    );
    mat.uniforms.uOutScale.value = outputScale;
    mat.uniforms.uBg.value.set(...bgRgb);
    mat.uniforms.uAlpha.value = opacity;
    mat.uniforms.uCursorActive.value = cursorInteraction ? 1 : 0;
    mat.uniforms.uCursorIntensity.value = cursorIntensity;

    const ease = 1 - Math.exp(-delta / 0.15);
    smoothPointer.current.x += (pointer[0] - smoothPointer.current.x) * ease;
    smoothPointer.current.y += (pointer[1] - smoothPointer.current.y) * ease;
    mat.uniforms.uPointer.value.set(
      smoothPointer.current.x,
      smoothPointer.current.y,
    );
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={shaderUniforms}
        transparent
      />
    </mesh>
  );
};

const SwirlBlend: React.FC<SwirlBlendProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
  speed = 0.5,
  scale = 7,
  iterations = 5,
  cosFrequency = 3,
  cosAmplitude = 0.25,
  sinAmplitude = 0.35,
  modulationRate = 0.1,
  modulationDepth = 2,
  paletteBaseR = 0.75,
  paletteBaseG = 0.1,
  paletteBaseB = 0.55,
  paletteAmpR = 0.3,
  paletteAmpG = 0.35,
  paletteAmpB = 0.1,
  palettePhaseR = 0.3,
  palettePhaseG = 0.15,
  palettePhaseB = 0.2,
  outputScale = 10,
  backgroundColor = "#000000",
  opacity = 1,
  cursorInteraction = false,
  cursorIntensity = 1,
}) => {
  const bgRgb = useMemo(
    () => parseHexColor(backgroundColor),
    [backgroundColor],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<[number, number]>([0.5, 0.5]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!cursorInteraction) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1 - (e.clientY - rect.top) / rect.height;
      setPointer([nx, ny]);
    },
    [cursorInteraction],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height, backgroundColor }}
      onPointerMove={handlePointerMove}
    >
      <Canvas
        className="absolute inset-0 h-full w-full"
        orthographic
        camera={{
          position: [0, 0, 1],
          zoom: 1,
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <BlendScene
          speed={speed}
          scale={scale}
          iterations={iterations}
          cosFrequency={cosFrequency}
          cosAmplitude={cosAmplitude}
          sinAmplitude={sinAmplitude}
          modulationRate={modulationRate}
          modulationDepth={modulationDepth}
          paletteBaseR={paletteBaseR}
          paletteBaseG={paletteBaseG}
          paletteBaseB={paletteBaseB}
          paletteAmpR={paletteAmpR}
          paletteAmpG={paletteAmpG}
          paletteAmpB={paletteAmpB}
          palettePhaseR={palettePhaseR}
          palettePhaseG={palettePhaseG}
          palettePhaseB={palettePhaseB}
          outputScale={outputScale}
          bgRgb={bgRgb}
          opacity={opacity}
          pointer={pointer}
          cursorInteraction={cursorInteraction}
          cursorIntensity={cursorIntensity}
        />
      </Canvas>
      {children && (
        <div className="pointer-events-none relative z-10">{children}</div>
      )}
    </div>
  );
};

SwirlBlend.displayName = "SwirlBlend";

export default SwirlBlend;
