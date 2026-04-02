"use client";

import React, { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import * as THREE from "three";

export interface HalftoneVortexProps {
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
  /** Zoom level of the coordinate field */
  zoom?: number;
  /** Density of halftone dots */
  dotDensity?: number;
  /** Scale of the halftone grid sampling */
  gridScale?: number;
  /** Spiral twist amount driven by radius */
  spiralStrength?: number;
  /** Amplitude of radial sine waves */
  radialWave?: number;
  /** Amplitude of angular sine waves */
  angularWave?: number;
  /** Amplitude of slow angular pattern */
  patternDepth?: number;
  /** Distance offset before thresholding */
  fieldOffset?: number;
  /** Hard threshold for dot cutoff (0–1) */
  threshold?: number;
  /** Foreground color in hex */
  color?: string;
  /** Background color in hex */
  backgroundColor?: string;
  /** Use single color instead of RGB channel separation */
  monochrome?: boolean;
  /** Cursor follow dampening (0=instant, higher=smoother) */
  dampening?: number;
  /** Master opacity */
  opacity?: number;
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
uniform vec2 uPointer;
uniform float uSpeed;
uniform float uZoom;
uniform float uDotDensity;
uniform float uGridScale;
uniform float uSpiral;
uniform float uRadialWave;
uniform float uAngularWave;
uniform float uPatternDepth;
uniform float uFieldOffset;
uniform float uCutoff;
uniform vec3 uFg;
uniform vec3 uBg;
uniform bool uMono;
uniform float uAlpha;

const float TWO_PI = 6.2831853;
const float HALF_PI = 1.5707963;

float dots(float cx, float cy, float ang) {
  float invLen = 1.0 / sqrt(ang * ang + (1.0 - ang) * (1.0 - ang));
  float ru = cx * ang - cy * (1.0 - ang);
  float rv = cx * (1.0 - ang) + cy * ang;
  ru *= invLen;
  rv *= invLen;
  float density = uDotDensity * uRes.y;
  ru = fract(ru * density) - 0.5;
  rv = fract(rv * density) - 0.5;
  return 1.7 - sqrt(ru * ru + rv * rv) * 4.0;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 st = (vUv - uPointer) * vec2(aspect, 1.0) * uZoom;

  float t = uTime * uSpeed;
  float dist = length(st);
  float ang = atan(st.x, st.y) / TWO_PI + sin(dist + t) * uSpiral;

  float rWaveR = sin(dist * TWO_PI + t * 4.0) * uRadialWave;
  float aWaveR = sin(ang * TWO_PI * 11.0 + t * 4.0) * uAngularWave;
  float patR = sin(ang * TWO_PI * 6.0 + t) * uPatternDepth;
  float fieldR = dist - rWaveR - aWaveR + patR + uFieldOffset;
  float dR = dots(st.x * uGridScale, st.y * uGridScale, 0.12);
  float chR = (fieldR + dR) > uCutoff ? 1.0 : 0.0;

  float rWaveG = sin(dist * TWO_PI * 1.5 + t * 5.0) * uRadialWave;
  float aWaveG = sin(ang * TWO_PI * 13.0 + t * 5.0) * uAngularWave;
  float patG = sin(ang * TWO_PI * 4.0 - t) * uPatternDepth;
  float fieldG = dist - rWaveG - aWaveG - patG + uFieldOffset;
  float dG = dots(st.x * uGridScale, st.y * uGridScale, 0.34);
  float chG = (fieldG + dG) > uCutoff ? 1.0 : 0.0;

  float rWaveB = sin(dist * TWO_PI + t * 8.0) * uRadialWave;
  float aWaveB = sin(ang * TWO_PI * 12.0 + t * 6.0) * uAngularWave;
  float patB = sin(ang * TWO_PI * 5.0) * uPatternDepth;
  float fieldB = dist - rWaveB - aWaveB - patB + uFieldOffset;
  float dB = dots(st.x * uGridScale, st.y * uGridScale, 0.69);
  float chB = (fieldB + dB) > uCutoff ? 1.0 : 0.0;

  vec3 mask = uMono ? vec3(chR) : vec3(chR, chG, chB);
  vec3 result = mix(uBg, uFg, mask);

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

interface VortexSceneProps {
  speed: number;
  zoom: number;
  dotDensity: number;
  gridScale: number;
  spiralStrength: number;
  radialWave: number;
  angularWave: number;
  patternDepth: number;
  fieldOffset: number;
  threshold: number;
  color: string;
  backgroundColor: string;
  monochrome: boolean;
  opacity: number;
  pointer: [number, number];
  dampening: number;
}

const VortexScene: React.FC<VortexSceneProps> = ({
  speed,
  zoom,
  dotDensity,
  gridScale,
  spiralStrength,
  radialWave,
  angularWave,
  patternDepth,
  fieldOffset,
  threshold,
  color,
  backgroundColor,
  monochrome,
  opacity,
  pointer,
  dampening,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uSpeed: { value: 0.5 },
      uZoom: { value: 5 },
      uDotDensity: { value: 0.0002 },
      uGridScale: { value: 150 },
      uSpiral: { value: 0.2 },
      uRadialWave: { value: 0.1 },
      uAngularWave: { value: 0.4 },
      uPatternDepth: { value: 0.75 },
      uFieldOffset: { value: -0.6 },
      uCutoff: { value: 0.5 },
      uFg: { value: new THREE.Vector3(0, 0, 0) },
      uBg: { value: new THREE.Vector3(1, 0.624, 0.988) },
      uMono: { value: true },
      uAlpha: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uRes.value.set(size.width, size.height);

    const ease = 1 - Math.exp(-delta / Math.max(dampening, 0.001));
    smoothPointer.current.x += (pointer[0] - smoothPointer.current.x) * ease;
    smoothPointer.current.y += (pointer[1] - smoothPointer.current.y) * ease;
    mat.uniforms.uPointer.value.set(
      smoothPointer.current.x,
      smoothPointer.current.y,
    );

    mat.uniforms.uSpeed.value = speed;
    mat.uniforms.uZoom.value = zoom;
    mat.uniforms.uDotDensity.value = dotDensity;
    mat.uniforms.uGridScale.value = gridScale;
    mat.uniforms.uSpiral.value = spiralStrength;
    mat.uniforms.uRadialWave.value = radialWave;
    mat.uniforms.uAngularWave.value = angularWave;
    mat.uniforms.uPatternDepth.value = patternDepth;
    mat.uniforms.uFieldOffset.value = fieldOffset;
    mat.uniforms.uCutoff.value = threshold;
    mat.uniforms.uMono.value = monochrome;
    mat.uniforms.uAlpha.value = opacity;

    const [fr, fg, fb] = parseHexColor(color);
    mat.uniforms.uFg.value.set(fr, fg, fb);

    const [br, bg, bb] = parseHexColor(backgroundColor);
    mat.uniforms.uBg.value.set(br, bg, bb);
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

const HalftoneVortex: React.FC<HalftoneVortexProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
  speed = 0.5,
  zoom = 5,
  dotDensity = 0.0002,
  gridScale = 150,
  spiralStrength = 0.2,
  radialWave = 0.1,
  angularWave = 0.4,
  patternDepth = 0.75,
  fieldOffset = -0.6,
  threshold = 0.5,
  color = "#000000",
  backgroundColor = "#FF9FFC",
  monochrome = true,
  dampening = 0.301,
  opacity = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<[number, number]>([0.5, 0.5]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1 - (e.clientY - rect.top) / rect.height;
      setPointer([nx, ny]);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
      onPointerMove={handlePointerMove}
    >
      <Canvas
        className="absolute inset-0"
        gl={{ antialias: true, alpha: true }}
        orthographic
        camera={{
          position: [0, 0, 1],
          zoom: 1,
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
        }}
      >
        <VortexScene
          speed={speed}
          zoom={zoom}
          dotDensity={dotDensity}
          gridScale={gridScale}
          spiralStrength={spiralStrength}
          radialWave={radialWave}
          angularWave={angularWave}
          patternDepth={patternDepth}
          fieldOffset={fieldOffset}
          threshold={threshold}
          color={color}
          backgroundColor={backgroundColor}
          monochrome={monochrome}
          opacity={opacity}
          pointer={pointer}
          dampening={dampening}
        />
      </Canvas>
      {children && <div className="relative z-1">{children}</div>}
    </div>
  );
};

HalftoneVortex.displayName = "HalftoneVortex";

export default HalftoneVortex;
