"use client";

import React, { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import * as THREE from "three";

export interface FlamePathsProps {
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
  /** Vertical center offset of the wave field */
  centerShift?: number;
  /** Amplitude of the sine wave driving vertical distortion */
  waveAmplitude?: number;
  /** Frequency multiplier for the horizontal wave */
  waveFrequency?: number;
  /** Frequency of the inner sine warp layer */
  innerFrequency?: number;
  /** Horizontal offset subtracted via vertical sine */
  horizontalPull?: number;
  /** Animation direction: 0=right, 1=left, 2=up, 3=down */
  direction?: number;
  /** Exponent applied to the plus-channel cosine */
  plusPower?: number;
  /** Exponent applied to the minus-channel cosine */
  minusPower?: number;
  /** Red channel brightness multiplier */
  redGain?: number;
  /** Green channel brightness multiplier */
  greenGain?: number;
  /** Blue channel brightness multiplier */
  blueGain?: number;
  /** Green channel extra power curve */
  greenPower?: number;
  /** Blue channel extra power curve */
  bluePower?: number;
  /** Background color in hex */
  backgroundColor?: string;
  /** Master opacity */
  opacity?: number;
  /** Enable cursor interaction to intensify flame amplitude near pointer */
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
uniform float uCenter;
uniform float uAmp;
uniform float uFreq;
uniform float uInnerFreq;
uniform float uPull;
uniform int uDir;
uniform float uPowA;
uniform float uPowB;
uniform float uRedGain;
uniform float uGreenGain;
uniform float uBlueGain;
uniform float uGreenPow;
uniform float uBluePow;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

const float TAU = 6.2831853;
const float PI = 3.14159265;

void main() {
  float aspect = uRes.x / uRes.y;

  vec2 st = vec2(vUv.x * aspect, vUv.y);
  vec2 nrm = vUv;

  if (uDir == 1) {
    st.x = aspect - st.x;
    nrm.x = 1.0 - nrm.x;
  } else if (uDir == 2) {
    float tmp = st.x;
    st.x = st.y;
    st.y = aspect - tmp;
    float ntmp = nrm.x;
    nrm.x = nrm.y;
    nrm.y = 1.0 - ntmp;
  } else if (uDir == 3) {
    float tmp = st.x;
    st.x = 1.0 - st.y;
    st.y = tmp;
    float ntmp = nrm.x;
    nrm.x = 1.0 - nrm.y;
    nrm.y = ntmp;
  }

  st.y -= uCenter;

  float t = uTime * uSpeed;

  vec2 pointerNrm = uPointer;
  float cursorDist = length(nrm - pointerNrm);
  float cursorInfluence = smoothstep(0.5, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localAmp = uAmp + cursorInfluence * 3.0;
  float localPowA = uPowA - cursorInfluence * 4.0;
  float localPowB = uPowB - cursorInfluence * 1.5;

  st.y *= sin(nrm.x * uFreq * TAU + t) + localAmp;

  st.y = st.x + sin(sin(st.y * uInnerFreq));

  st.x -= abs(sin(nrm.y * PI)) * uPull;
  st.x -= t;

  float combine = st.x + st.y;
  float diff = st.x - st.y;

  float cA = cos(combine);
  float cB = cos(diff);

  float fire = sqrt(pow(abs(cA), max(localPowA, 1.0)) * pow(abs(cB), max(localPowB, 1.0)));

  float intensityBoost = 1.0 + cursorInfluence * 0.5;
  vec3 col = vec3(
    fire * nrm.x * uRedGain * intensityBoost,
    pow(fire, uGreenPow) * nrm.x * uGreenGain * intensityBoost,
    pow(fire, uBluePow) * nrm.x * nrm.y * uBlueGain * intensityBoost
  );

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 result = mix(uBg, col, clamp(lum * 8.0, 0.0, 1.0));

  gl_FragColor = vec4(result, uAlpha);
}
`;

interface FlameSceneProps {
  speed: number;
  centerShift: number;
  waveAmplitude: number;
  waveFrequency: number;
  innerFrequency: number;
  horizontalPull: number;
  direction: number;
  plusPower: number;
  minusPower: number;
  redGain: number;
  greenGain: number;
  blueGain: number;
  greenPower: number;
  bluePower: number;
  backgroundColor: string;
  opacity: number;
  pointer: [number, number];
  cursorInteraction: boolean;
  cursorIntensity: number;
}

function parseHexColor(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [0, 0, 0];
  return [
    parseInt(match[1], 16) / 255,
    parseInt(match[2], 16) / 255,
    parseInt(match[3], 16) / 255,
  ];
}

const FlameScene: React.FC<FlameSceneProps> = ({
  speed,
  centerShift,
  waveAmplitude,
  waveFrequency,
  innerFrequency,
  horizontalPull,
  direction,
  plusPower,
  minusPower,
  redGain,
  greenGain,
  blueGain,
  greenPower,
  bluePower,
  backgroundColor,
  opacity,
  pointer,
  cursorInteraction,
  cursorIntensity,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSpeed: { value: 0.5 },
      uCenter: { value: 0.5 },
      uAmp: { value: 15 },
      uFreq: { value: 2 },
      uInnerFreq: { value: 3 },
      uPull: { value: 1 },
      uDir: { value: 2 },
      uPowA: { value: 30 },
      uPowB: { value: 10 },
      uRedGain: { value: 2 },
      uGreenGain: { value: 0 },
      uBlueGain: { value: 5 },
      uGreenPow: { value: 1 },
      uBluePow: { value: 1.5 },
      uBg: { value: new THREE.Vector3(0, 0, 0) },
      uAlpha: { value: 1 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uCursorActive: { value: 0 },
      uCursorIntensity: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uRes.value.set(size.width, size.height);
    mat.uniforms.uSpeed.value = speed;
    mat.uniforms.uCenter.value = centerShift;
    mat.uniforms.uAmp.value = waveAmplitude;
    mat.uniforms.uFreq.value = waveFrequency;
    mat.uniforms.uInnerFreq.value = innerFrequency;
    mat.uniforms.uPull.value = horizontalPull;
    mat.uniforms.uDir.value = direction;
    mat.uniforms.uPowA.value = plusPower;
    mat.uniforms.uPowB.value = minusPower;
    mat.uniforms.uRedGain.value = redGain;
    mat.uniforms.uGreenGain.value = greenGain;
    mat.uniforms.uBlueGain.value = blueGain;
    mat.uniforms.uGreenPow.value = greenPower;
    mat.uniforms.uBluePow.value = bluePower;
    const [r, g, b] = parseHexColor(backgroundColor);
    mat.uniforms.uBg.value.set(r, g, b);
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

const FlamePaths: React.FC<FlamePathsProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
  speed = 0.5,
  centerShift = 1,
  waveAmplitude = 10,
  waveFrequency = 0.6,
  innerFrequency = 2.5,
  horizontalPull = 1,
  direction = 2,
  plusPower = 30,
  minusPower = 10,
  redGain = 2,
  greenGain = 0,
  blueGain = 5,
  greenPower = 1,
  bluePower = 1.5,
  backgroundColor = "#000000",
  opacity = 1,
  cursorInteraction = false,
  cursorIntensity = 1,
}) => {
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
        <FlameScene
          speed={speed}
          centerShift={centerShift}
          waveAmplitude={waveAmplitude}
          waveFrequency={waveFrequency}
          innerFrequency={innerFrequency}
          horizontalPull={horizontalPull}
          direction={direction}
          plusPower={plusPower}
          minusPower={minusPower}
          redGain={redGain}
          greenGain={greenGain}
          blueGain={blueGain}
          greenPower={greenPower}
          bluePower={bluePower}
          backgroundColor={backgroundColor}
          opacity={opacity}
          pointer={pointer}
          cursorInteraction={cursorInteraction}
          cursorIntensity={cursorIntensity}
        />
      </Canvas>
      {children && <div className="relative z-1">{children}</div>}
    </div>
  );
};

FlamePaths.displayName = "FlamePaths";

export default FlamePaths;
