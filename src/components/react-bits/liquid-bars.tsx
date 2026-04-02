"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface LiquidBarsProps {
  /** Width of the component in pixels or CSS value */
  width?: number | string;
  /** Height of the component in pixels or CSS value */
  height?: number | string;
  /** Animation speed multiplier (0.1-5) */
  speed?: number;
  /** Base color in hex format */
  color?: string;
  /** Number of vertical bars */
  barCount?: number;

  /** Scale of the wave pattern (0.1-10) - higher = larger waves */
  scale?: number;
  /** Wave complexity - number of noise layers (1-5) */
  waveComplexity?: number;
  /** Wave amplitude - intensity of wave displacement (0-2) */
  waveAmplitude?: number;
  /** Reflection band frequency (1-20) */
  reflectionFrequency?: number;
  /** Streak intensity - brightness of highlight streaks (0-1) */
  streakIntensity?: number;
  /** Metallic contrast - difference between dark and bright areas (0-2) */
  metallicContrast?: number;
  /** Highlight warmth - warm tint on highlights (0-1) */
  highlightWarmth?: number;

  /** Refraction strength at bar edges (0-5) */
  refractionStrength?: number;
  /** Edge width - width of refraction zone (0.01-0.5) */
  edgeWidth?: number;
  /** Edge softness - blur at bar boundaries (0.01-0.2) */
  edgeSoftness?: number;
  /** Fresnel intensity - edge glow effect (0-1) */
  fresnelIntensity?: number;
  /** Edge highlight brightness (0-1) */
  edgeHighlight?: number;
  /** Gap darkness - how dark the gaps between bars are (0-1) */
  gapDarkness?: number;
  /** Refraction wave speed - speed of wavy refraction (0-5) */
  refractionWaveSpeed?: number;
  /** Refraction wave frequency - frequency of edge waves (1-30) */
  refractionWaveFrequency?: number;

  /** Master opacity (0-1) */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
  /** Content to render on top of the effect */
  children?: React.ReactNode;
}

const combinedFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBarCount;
  uniform float uScale;

  uniform float uWaveComplexity;
  uniform float uWaveAmplitude;
  uniform float uReflectionFrequency;
  uniform float uStreakIntensity;
  uniform float uMetallicContrast;
  uniform float uHighlightWarmth;

  uniform float uRefractionStrength;
  uniform float uEdgeWidth;
  uniform float uEdgeSoftness;
  uniform float uFresnelIntensity;
  uniform float uEdgeHighlight;
  uniform float uGapDarkness;
  uniform float uRefractionWaveSpeed;
  uniform float uRefractionWaveFrequency;

  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  vec3 getMetallicColor(vec2 uv, vec2 resolution, vec3 color, float time) {
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    p *= uScale;

    float t = time * 0.3;

    float waves = snoise(vec3(p * 1.5, t * 0.5)) * 0.5 * uWaveAmplitude;

    if (uWaveComplexity >= 2.0) {
      waves += snoise(vec3(p * 2.0 + 10.0, t * 0.7)) * 0.35 * uWaveAmplitude;
    }
    if (uWaveComplexity >= 3.0) {
      waves += snoise(vec3(p * 4.0 + 20.0, t * 0.9)) * 0.15 * uWaveAmplitude;
    }
    if (uWaveComplexity >= 4.0) {
      waves += snoise(vec3(p * 6.0 + 30.0, t * 1.1)) * 0.1 * uWaveAmplitude;
    }
    if (uWaveComplexity >= 5.0) {
      waves += snoise(vec3(p * 8.0 + 40.0, t * 1.3)) * 0.05 * uWaveAmplitude;
    }

    float reflection = sin(waves * uReflectionFrequency + p.y * 3.0) * 0.5 + 0.5;
    reflection = pow(reflection, 1.5);

    float streak1 = smoothstep(0.4, 0.5, sin(waves * 12.0 + t)) * uStreakIntensity;
    float streak2 = smoothstep(0.6, 0.7, sin(waves * 8.0 - p.x * 2.0 + t * 1.5)) * uStreakIntensity;

    float darkMult = 0.08 / uMetallicContrast;
    float midMult = 0.5;
    float brightMult = 0.5 + 0.7 * uMetallicContrast;

    vec3 darkColor = color * darkMult;
    vec3 midColor = color * midMult;
    vec3 brightColor = color * brightMult;
    vec3 highlightColor = mix(color, vec3(1.0), 0.7);

    vec3 finalColor = mix(darkColor, midColor, reflection);
    finalColor = mix(finalColor, brightColor, pow(reflection, 2.0));
    finalColor = mix(finalColor, highlightColor, streak1 * 0.6);
    finalColor += highlightColor * streak2 * 0.3;

    finalColor += vec3(0.08, 0.06, 0.03) * pow(reflection, 3.0) * uHighlightWarmth;

    return finalColor;
  }

  void main() {
    vec2 uv = vUv;

    float barWidth = 1.0 / uBarCount;
    float barIndex = floor(uv.x / barWidth);
    float barLocal = mod(uv.x, barWidth) / barWidth;

    float edgeWidth = uEdgeWidth;

    float leftDist = barLocal / edgeWidth;
    float rightDist = (1.0 - barLocal) / edgeWidth;
    float edgeDist = min(leftDist, rightDist);
    float inEdgeZone = 1.0 - clamp(edgeDist, 0.0, 1.0);

    vec2 refractionOffset = vec2(0.0);

    if (barLocal < edgeWidth) {
      float t = 1.0 - barLocal / edgeWidth;
      float curve = t * t * t;
      refractionOffset.x = curve * uRefractionStrength * 0.08;
      refractionOffset.y = sin(uv.y * uRefractionWaveFrequency + uTime * uRefractionWaveSpeed) * curve * uRefractionStrength * 0.015;
    }
    else if (barLocal > 1.0 - edgeWidth) {
      float t = (barLocal - (1.0 - edgeWidth)) / edgeWidth;
      float curve = t * t * t;
      refractionOffset.x = -curve * uRefractionStrength * 0.08;
      refractionOffset.y = sin(uv.y * uRefractionWaveFrequency + uTime * uRefractionWaveSpeed + 3.14159) * curve * uRefractionStrength * 0.015;
    }

    vec2 refractedUV = clamp(uv + refractionOffset, 0.0, 1.0);
    vec3 metallic = getMetallicColor(refractedUV, uResolution, uColor, uTime);

    float barMask = smoothstep(0.0, uEdgeSoftness, barLocal) * smoothstep(1.0, 1.0 - uEdgeSoftness, barLocal);

    float gapDarken = mix(1.0 - uGapDarkness, 1.0, barMask);

    float edgeHighlightVal = inEdgeZone * uEdgeHighlight * barMask;

    float fresnel = pow(inEdgeZone, 2.0) * uFresnelIntensity;

    vec3 finalColor = metallic * gapDarken;
    finalColor += vec3(1.0) * edgeHighlightVal;
    finalColor += uColor * fresnel * 0.3;

    gl_FragColor = vec4(finalColor, uOpacity * barMask);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface SceneProps {
  color: THREE.Color;
  opacity: number;
  speed: number;
  barCount: number;
  scale: number;
  waveComplexity: number;
  waveAmplitude: number;
  reflectionFrequency: number;
  streakIntensity: number;
  metallicContrast: number;
  highlightWarmth: number;
  refractionStrength: number;
  edgeWidth: number;
  edgeSoftness: number;
  fresnelIntensity: number;
  edgeHighlight: number;
  gapDarkness: number;
  refractionWaveSpeed: number;
  refractionWaveFrequency: number;
}

function Scene({
  color,
  opacity,
  speed,
  barCount,
  scale,
  waveComplexity,
  waveAmplitude,
  reflectionFrequency,
  streakIntensity,
  metallicContrast,
  highlightWarmth,
  refractionStrength,
  edgeWidth,
  edgeSoftness,
  fresnelIntensity,
  edgeHighlight,
  gapDarkness,
  refractionWaveSpeed,
  refractionWaveFrequency,
}: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(100, 100) },
      uColor: { value: new THREE.Color() },
      uOpacity: { value: 1 },
      uBarCount: { value: 12 },
      uScale: { value: 1 },
      uWaveComplexity: { value: 3 },
      uWaveAmplitude: { value: 1 },
      uReflectionFrequency: { value: 8 },
      uStreakIntensity: { value: 1 },
      uMetallicContrast: { value: 1 },
      uHighlightWarmth: { value: 1 },
      uRefractionStrength: { value: 1 },
      uEdgeWidth: { value: 0.12 },
      uEdgeSoftness: { value: 0.03 },
      uFresnelIntensity: { value: 0.2 },
      uEdgeHighlight: { value: 0.12 },
      uGapDarkness: { value: 0.6 },
      uRefractionWaveSpeed: { value: 2 },
      uRefractionWaveFrequency: { value: 12.566 },
    }),
    [],
  );

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime * speed;
      material.uniforms.uColor.value = color;
      material.uniforms.uOpacity.value = opacity;
      material.uniforms.uBarCount.value = barCount;
      material.uniforms.uScale.value = scale;
      material.uniforms.uWaveComplexity.value = waveComplexity;
      material.uniforms.uWaveAmplitude.value = waveAmplitude;
      material.uniforms.uReflectionFrequency.value = reflectionFrequency;
      material.uniforms.uStreakIntensity.value = streakIntensity;
      material.uniforms.uMetallicContrast.value = metallicContrast;
      material.uniforms.uHighlightWarmth.value = highlightWarmth;
      material.uniforms.uRefractionStrength.value = refractionStrength;
      material.uniforms.uEdgeWidth.value = edgeWidth;
      material.uniforms.uEdgeSoftness.value = edgeSoftness;
      material.uniforms.uFresnelIntensity.value = fresnelIntensity;
      material.uniforms.uEdgeHighlight.value = edgeHighlight;
      material.uniforms.uGapDarkness.value = gapDarkness;
      material.uniforms.uRefractionWaveSpeed.value = refractionWaveSpeed;
      material.uniforms.uRefractionWaveFrequency.value =
        refractionWaveFrequency;
      material.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={combinedFragmentShader}
        transparent
      />
    </mesh>
  );
}

const LiquidBars: React.FC<LiquidBarsProps> = ({
  width = "100%",
  height = "100%",
  speed = 1,
  color = "#a855f7",
  barCount = 6,
  scale = 0.4,
  waveComplexity = 1,
  waveAmplitude = 0.6,
  reflectionFrequency = 20,
  streakIntensity = 0.25,
  metallicContrast = 2,
  highlightWarmth = 0.5,
  refractionStrength = 5,
  edgeWidth = 0.3,
  edgeSoftness = 0.04,
  fresnelIntensity = 0.2,
  edgeHighlight = 0.1,
  gapDarkness = 0.2,
  refractionWaveSpeed = 1.4,
  refractionWaveFrequency = 20,
  opacity = 1,
  className,
  children,
}) => {
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    >
      <Canvas
        className="absolute inset-0"
        orthographic
        camera={{
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
          near: 0,
          far: 10,
          position: [0, 0, 5],
        }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene
          color={threeColor}
          opacity={opacity}
          speed={speed}
          barCount={barCount}
          scale={scale}
          waveComplexity={waveComplexity}
          waveAmplitude={waveAmplitude}
          reflectionFrequency={reflectionFrequency}
          streakIntensity={streakIntensity}
          metallicContrast={metallicContrast}
          highlightWarmth={highlightWarmth}
          refractionStrength={refractionStrength}
          edgeWidth={edgeWidth}
          edgeSoftness={edgeSoftness}
          fresnelIntensity={fresnelIntensity}
          edgeHighlight={edgeHighlight}
          gapDarkness={gapDarkness}
          refractionWaveSpeed={refractionWaveSpeed}
          refractionWaveFrequency={refractionWaveFrequency}
        />
      </Canvas>
      {children && (
        <div className="relative z-10 w-full h-full pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

LiquidBars.displayName = "LiquidBars";

export default LiquidBars;
