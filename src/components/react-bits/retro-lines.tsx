"use client";

import React, { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import * as THREE from "three";

export interface RetroLinesProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Content rendered above the effect */
  children?: React.ReactNode;
  /** Overall animation speed multiplier */
  speed?: number;
  /** Vertical scroll rate of the grid cells */
  scrollSpeed?: number;
  /** Number of grid cells per unit (line density) */
  density?: number;
  /** Perspective bend divisor — higher values flatten the curve */
  curvature?: number;
  /** Exponent controlling perspective distortion intensity */
  curveExponent?: number;
  /** Y-axis offset for the vanishing point */
  vanishPoint?: number;
  /** Scale of the wave pattern */
  waveScale?: number;
  /** Strength of the sinusoidal wave distortion */
  waveAmplitude?: number;
  /** Exponent sharpening the wave peaks */
  wavePower?: number;
  /** Minimum wave intensity to be visible (0–1) */
  waveThreshold?: number;
  /** Y coordinate where lines begin appearing */
  lineStart?: number;
  /** Y coordinate reference for line sizing gradient */
  lineEnd?: number;
  /** Gap between lines — higher values create more spacing */
  lineGap?: number;
  /** Speed multiplier for color cycling between the two tones */
  colorSpeed?: number;
  /** Spatial frequency of the color pattern */
  colorFrequency?: number;
  /** Primary line color (hex) */
  color1?: string;
  /** Secondary line color (hex) */
  color2?: string;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Master opacity (0–1) */
  opacity?: number;
  /** Enable cursor interaction to shift the vanishing point */
  cursorInteraction?: boolean;
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

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uScroll;
uniform float uDensity;
uniform float uCurve;
uniform float uCurvePow;
uniform float uVanish;
uniform float uWaveScale;
uniform float uWaveAmp;
uniform float uWavePow;
uniform float uWaveEdge;
uniform float uStartY;
uniform float uEndY;
uniform float uLineGap;
uniform float uColorRate;
uniform float uColorFreq;
uniform vec3 uTone1;
uniform vec3 uTone2;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;

void main() {
  vec2 st = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  float pointerShiftX = (uPointer.x - 0.5) * 2.0 * uCursorActive;
  float radial = length(st + vec2(pointerShiftX, uVanish));
  float warp = pow(radial, uCurvePow) / uCurve;
  st /= warp;

  float span = (st.y - uStartY) / (uEndY - uStartY);
  span = 1.0 - span;
  float baseSpan = span;

  float cap = 0.9;
  span = mix(span, cap, step(cap, span) - step(1.0, span));
  span = clamp((1.0 - span) * 0.5, 0.0, 0.5);

  float elapsed = uTime * uSpeed;

  vec2 cell = vec2(
    fract(st.x * uDensity),
    fract(st.y * uDensity - uScroll * elapsed)
  );
  float grid = step(span, cell.x) - step(1.0 - span, cell.x);
  grid = min(grid, step(span, cell.y) - step(1.0 - span, cell.y));

  vec2 wc = vec2(st.x * uWaveScale * 0.7 / uLineGap, st.y * uWaveScale * 0.5);
  wc.x += uWaveAmp * sin(wc.y - elapsed);
  float ridge = pow(max(0.0, sin(wc.x)), uWavePow);
  ridge = smoothstep(uWaveEdge, 1.0, ridge);
  ridge *= step(uStartY, st.y) * grid;
  ridge = clamp(ridge, 0.0, 1.0);

  float phase = sin(-wc.x * uColorFreq + wc.y * uColorFreq - uColorRate * elapsed);
  vec3 tint = mix(uTone1, uTone2, smoothstep(-0.5, 0.5, phase));

  vec3 result = mix(uBg, tint, ridge);
  result = mix(uBg, result, smoothstep(uStartY, uStartY + 0.2, st.y));

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

interface RetroSceneProps {
  speed: number;
  scrollSpeed: number;
  density: number;
  curvature: number;
  curveExponent: number;
  vanishPoint: number;
  waveScale: number;
  waveAmplitude: number;
  wavePower: number;
  waveThreshold: number;
  lineStart: number;
  lineEnd: number;
  lineGap: number;
  colorSpeed: number;
  colorFrequency: number;
  tone1Rgb: [number, number, number];
  tone2Rgb: [number, number, number];
  bgRgb: [number, number, number];
  opacity: number;
  pointer: [number, number];
  cursorInteraction: boolean;
}

const RetroScene: React.FC<RetroSceneProps> = ({
  speed,
  scrollSpeed,
  density,
  curvature,
  curveExponent,
  vanishPoint,
  waveScale,
  waveAmplitude,
  wavePower,
  waveThreshold,
  lineStart,
  lineEnd,
  lineGap,
  colorSpeed,
  colorFrequency,
  tone1Rgb,
  tone2Rgb,
  bgRgb,
  opacity,
  pointer,
  cursorInteraction,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSpeed: { value: speed },
      uScroll: { value: scrollSpeed },
      uDensity: { value: density },
      uCurve: { value: curvature },
      uCurvePow: { value: curveExponent },
      uVanish: { value: vanishPoint },
      uWaveScale: { value: waveScale },
      uWaveAmp: { value: waveAmplitude },
      uWavePow: { value: wavePower },
      uWaveEdge: { value: waveThreshold },
      uStartY: { value: lineStart },
      uEndY: { value: lineEnd },
      uLineGap: { value: lineGap },
      uColorRate: { value: colorSpeed },
      uColorFreq: { value: colorFrequency },
      uTone1: { value: new THREE.Vector3(...tone1Rgb) },
      uTone2: { value: new THREE.Vector3(...tone2Rgb) },
      uBg: { value: new THREE.Vector3(...bgRgb) },
      uAlpha: { value: opacity },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uCursorActive: { value: 0 },
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
    mat.uniforms.uScroll.value = scrollSpeed;
    mat.uniforms.uDensity.value = density;
    mat.uniforms.uCurve.value = curvature;
    mat.uniforms.uCurvePow.value = curveExponent;
    mat.uniforms.uVanish.value = vanishPoint;
    mat.uniforms.uWaveScale.value = waveScale;
    mat.uniforms.uWaveAmp.value = waveAmplitude;
    mat.uniforms.uWavePow.value = wavePower;
    mat.uniforms.uWaveEdge.value = waveThreshold;
    mat.uniforms.uStartY.value = lineStart;
    mat.uniforms.uEndY.value = lineEnd;
    mat.uniforms.uLineGap.value = lineGap;
    mat.uniforms.uColorRate.value = colorSpeed;
    mat.uniforms.uColorFreq.value = colorFrequency;
    mat.uniforms.uTone1.value.set(...tone1Rgb);
    mat.uniforms.uTone2.value.set(...tone2Rgb);
    mat.uniforms.uBg.value.set(...bgRgb);
    mat.uniforms.uAlpha.value = opacity;
    mat.uniforms.uCursorActive.value = cursorInteraction ? 1 : 0;

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

const RetroLines: React.FC<RetroLinesProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
  speed = 0.5,
  scrollSpeed = 2,
  density = 150,
  curvature = 60,
  curveExponent = 4,
  vanishPoint = 3.5,
  waveScale = 50,
  waveAmplitude = 2,
  wavePower = 6,
  waveThreshold = 0.35,
  lineStart = -1,
  lineEnd = 0.5,
  lineGap = 0.3,
  colorSpeed = 7,
  colorFrequency = 2,
  color1 = "#290596",
  color2 = "#93229D",
  backgroundColor = "#000000",
  opacity = 1,
  cursorInteraction = false,
}) => {
  const tone1Rgb = useMemo(() => parseHexColor(color1), [color1]);
  const tone2Rgb = useMemo(() => parseHexColor(color2), [color2]);
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
        <RetroScene
          speed={speed}
          scrollSpeed={scrollSpeed}
          density={density}
          curvature={curvature}
          curveExponent={curveExponent}
          vanishPoint={vanishPoint}
          waveScale={waveScale}
          waveAmplitude={waveAmplitude}
          wavePower={wavePower}
          waveThreshold={waveThreshold}
          lineStart={lineStart}
          lineEnd={lineEnd}
          lineGap={lineGap}
          colorSpeed={colorSpeed}
          colorFrequency={colorFrequency}
          tone1Rgb={tone1Rgb}
          tone2Rgb={tone2Rgb}
          bgRgb={bgRgb}
          opacity={opacity}
          pointer={pointer}
          cursorInteraction={cursorInteraction}
        />
      </Canvas>
      {children && (
        <div className="pointer-events-none relative z-10">{children}</div>
      )}
    </div>
  );
};

RetroLines.displayName = "RetroLines";

export default RetroLines;
