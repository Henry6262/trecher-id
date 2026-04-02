"use client";

import React, { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import * as THREE from "three";

export interface SimpleSwirlProps {
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
  /** Rotation direction: 1 = clockwise, -1 = counter-clockwise */
  direction?: number;
  /** Overall zoom into the swirl */
  zoom?: number;
  /** Number of concentric layers */
  layers?: number;
  /** Spacing increment per layer */
  layerStep?: number;
  /** Rotation per layer in radians */
  twist?: number;
  /** Line thickness factor */
  lineWeight?: number;
  /** Gamma exponent for contrast */
  gamma?: number;
  /** Foreground swirl color (hex) */
  swirlColor?: string;
  /** Background fill color (hex) */
  backgroundColor?: string;
  /** Radial fade-out start distance */
  vignetteStart?: number;
  /** Radial fade-out end distance */
  vignetteEnd?: number;
  /** Center glow intensity */
  glowStrength?: number;
  /** Center glow radius */
  glowRadius?: number;
  /** Master opacity (0–1) */
  opacity?: number;
  /** Enable cursor interaction to warp twist and line weight near pointer */
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

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uDir;
uniform float uZoom;
uniform float uCount;
uniform float uIncr;
uniform float uAngle;
uniform float uWeight;
uniform float uContrast;
uniform vec3 uFg;
uniform vec3 uBg;
uniform float uFadeInner;
uniform float uFadeOuter;
uniform float uCoreGlow;
uniform float uCoreSize;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

vec2 rotate2d(vec2 v, float a) {
  float c = cos(a), s = sin(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

float frame(vec2 p, float ext) {
  vec2 g = abs(p) - ext;
  float e = length(max(g, 0.0));
  return step(e, 0.001 * uWeight);
}

void main() {
  vec2 coord = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 px = vec3(1.06);

  coord *= uZoom;
  coord = rotate2d(coord, uTime * uSpeed * uDir * 0.5);

  vec2 pointerPos = (uPointer - vec2(0.5)) * vec2(uRes.x / uRes.y, 1.0) * uZoom;
  vec2 rawCoord = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * uZoom;
  float cursorDist = length(rawCoord - pointerPos);
  float cursorInfluence = smoothstep(0.4, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localAngle = uAngle + cursorInfluence * 0.08;
  float localWeight = uWeight + cursorInfluence * 1.5;

  float step_size = uIncr;
  for (float n = 0.0; n < 30.0; n += step_size) {
    if (n >= uCount) break;
    coord = rotate2d(coord, localAngle);
    float ext = 0.01 * n;
    px -= frame(coord, ext) * 0.0037 * localWeight;
  }

  px *= px * uContrast;

  float r = length(coord);
  px += smoothstep(uFadeInner, uFadeOuter, r);
  px += smoothstep(uCoreSize, 0.0, r) * uCoreGlow;

  px -= cursorInfluence * 0.06;

  px = clamp(px, 0.0, 1.0);

  float brightness = dot(px, vec3(0.299, 0.587, 0.114));
  vec3 tinted = mix(uFg, uBg, brightness);

  gl_FragColor = vec4(tinted, uAlpha);
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

interface SwirlSceneProps {
  speed: number;
  direction: number;
  zoom: number;
  layers: number;
  layerStep: number;
  twist: number;
  lineWeight: number;
  gamma: number;
  swirlRgb: [number, number, number];
  bgRgb: [number, number, number];
  vignetteStart: number;
  vignetteEnd: number;
  glowStrength: number;
  glowRadius: number;
  opacity: number;
  pointer: [number, number];
  cursorInteraction: boolean;
  cursorIntensity: number;
}

const SwirlScene: React.FC<SwirlSceneProps> = ({
  speed,
  direction,
  zoom,
  layers,
  layerStep,
  twist,
  lineWeight,
  gamma,
  swirlRgb,
  bgRgb,
  vignetteStart,
  vignetteEnd,
  glowStrength,
  glowRadius,
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
      uDir: { value: direction },
      uZoom: { value: zoom },
      uCount: { value: layers },
      uIncr: { value: layerStep },
      uAngle: { value: twist },
      uWeight: { value: lineWeight },
      uContrast: { value: gamma },
      uFg: { value: new THREE.Vector3(...swirlRgb) },
      uBg: { value: new THREE.Vector3(...bgRgb) },
      uFadeInner: { value: vignetteStart },
      uFadeOuter: { value: vignetteEnd },
      uCoreGlow: { value: glowStrength },
      uCoreSize: { value: glowRadius },
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
    mat.uniforms.uDir.value = direction;
    mat.uniforms.uZoom.value = zoom;
    mat.uniforms.uCount.value = layers;
    mat.uniforms.uIncr.value = layerStep;
    mat.uniforms.uAngle.value = twist;
    mat.uniforms.uWeight.value = lineWeight;
    mat.uniforms.uContrast.value = gamma;
    mat.uniforms.uFg.value.set(...swirlRgb);
    mat.uniforms.uBg.value.set(...bgRgb);
    mat.uniforms.uFadeInner.value = vignetteStart;
    mat.uniforms.uFadeOuter.value = vignetteEnd;
    mat.uniforms.uCoreGlow.value = glowStrength;
    mat.uniforms.uCoreSize.value = glowRadius;
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

const SimpleSwirl: React.FC<SimpleSwirlProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
  speed = 1,
  direction = 1,
  zoom = 0.32,
  layers = 20,
  layerStep = 0.13,
  twist = 0.05,
  lineWeight = 1,
  gamma = 1,
  swirlColor = "#5227FF",
  backgroundColor = "#ffffff",
  vignetteStart = 0,
  vignetteEnd = 0.47,
  glowStrength = 0.05,
  glowRadius = 0.05,
  opacity = 1,
  cursorInteraction = false,
  cursorIntensity = 1,
}) => {
  const swirlRgb = useMemo(() => parseHexColor(swirlColor), [swirlColor]);
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
        <SwirlScene
          speed={speed}
          direction={direction}
          zoom={zoom}
          layers={layers}
          layerStep={layerStep}
          twist={twist}
          lineWeight={lineWeight}
          gamma={gamma}
          swirlRgb={swirlRgb}
          bgRgb={bgRgb}
          vignetteStart={vignetteStart}
          vignetteEnd={vignetteEnd}
          glowStrength={glowStrength}
          glowRadius={glowRadius}
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

SimpleSwirl.displayName = "SimpleSwirl";

export default SimpleSwirl;
