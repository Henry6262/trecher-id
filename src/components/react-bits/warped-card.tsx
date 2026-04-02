"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface WarpedCardProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Card width inside the container */
  cardWidth?: string | number;
  /** Card aspect ratio (height / width, e.g. 1.3 for portrait) */
  aspectRatio?: number;
  /** Additional CSS classes */
  className?: string;
  /** Content rendered above the effect */
  children?: React.ReactNode;
  /** Image source URL */
  imageSrc?: string;
  /** Bulge distortion radius (0–1, fraction of the card) */
  radius?: number;
  /** Bulge distortion strength */
  strength?: number;
  /** Smoothing speed for mouse follow (0 = instant, higher = smoother) */
  dampening?: number;
  /** Transition duration in seconds for hover in/out */
  transitionDuration?: number;
  /** Border radius in CSS units */
  borderRadius?: string | number;
}

const VERTEX_SHADER = `
varying vec2 vUv;

uniform vec2 uRes;
uniform vec2 uTexRes;

vec2 coverUv(vec2 uv, vec2 texSize, vec2 viewSize) {
  vec2 ratio = vec2(
    min((viewSize.x / viewSize.y) / (texSize.x / texSize.y), 1.0),
    min((viewSize.y / viewSize.x) / (texSize.y / texSize.x), 1.0)
  );
  return uv * ratio + (1.0 - ratio) * 0.5;
}

void main() {
  vUv = coverUv(uv, uTexRes, uRes);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uMouse;
uniform float uBulge;
uniform float uRadius;
uniform float uStrength;
uniform float uHasTexture;

varying vec2 vUv;

vec2 bulge(vec2 uv, vec2 center) {
  uv -= center;

  float dist = length(uv) / uRadius;
  float distPow = pow(dist, 4.0);
  float scale = uStrength / (1.0 + distPow);

  uv *= (1.0 - uBulge) + uBulge * scale;

  uv += center;
  return uv;
}

void main() {
  vec2 bulgeUV = bulge(vUv, uMouse);

  if (uHasTexture > 0.5) {
    vec4 tex = texture2D(uTexture, bulgeUV);
    gl_FragColor = vec4(tex.rgb, 1.0);
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
`;

interface SceneProps {
  imageSrc: string;
  radius: number;
  strength: number;
  pointer: [number, number];
  bulgeAmount: number;
  dampening: number;
}

const Scene: React.FC<SceneProps> = ({
  imageSrc,
  radius,
  strength,
  pointer,
  bulgeAmount,
  dampening,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));
  const smoothBulge = useRef(0);
  const textureRef = useRef<THREE.Texture | null>(null);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: null as THREE.Texture | null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTexRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uBulge: { value: 0 },
      uRadius: { value: 0.95 },
      uStrength: { value: 1.1 },
      uHasTexture: { value: 0 },
    }),
    [],
  );

  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      imageSrc,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        textureRef.current = tex;
      },
      undefined,
      (err) => {
        if (!cancelled) {
          console.warn("WarpedCard: failed to load image", imageSrc, err);
          textureRef.current = null;
        }
      },
    );

    return () => {
      cancelled = true;
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [imageSrc]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;

    mat.uniforms.uRes.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
    );

    if (textureRef.current?.image) {
      mat.uniforms.uTexture.value = textureRef.current;
      const img = textureRef.current.image as HTMLImageElement;
      mat.uniforms.uTexRes.value.set(
        img.naturalWidth || img.width,
        img.naturalHeight || img.height,
      );
      mat.uniforms.uHasTexture.value = 1;
    } else {
      mat.uniforms.uHasTexture.value = 0;
    }

    const ease = 1 - Math.exp(-delta / Math.max(dampening, 0.001));
    smoothPointer.current.x += (pointer[0] - smoothPointer.current.x) * ease;
    smoothPointer.current.y += (pointer[1] - smoothPointer.current.y) * ease;
    mat.uniforms.uMouse.value.set(
      smoothPointer.current.x,
      smoothPointer.current.y,
    );

    smoothBulge.current += (bulgeAmount - smoothBulge.current) * ease;
    mat.uniforms.uBulge.value = smoothBulge.current;

    mat.uniforms.uRadius.value = radius;
    mat.uniforms.uStrength.value = strength;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

const WarpedCard: React.FC<WarpedCardProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
  imageSrc = "https://images.unsplash.com/photo-1773328781225-4d9f268510fa?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  cardWidth = 360,
  aspectRatio = 1.3,
  radius = 0.95,
  strength = 1.1,
  dampening = 0.07,
  transitionDuration = 0.8,
  borderRadius = "16px",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<[number, number]>([0.5, 0.5]);
  const [bulge, setBulge] = useState(0);
  const bulgeRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const animateBulge = useCallback(
    (target: number) => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      const start = bulgeRef.current;
      const startTime = performance.now();
      const duration = transitionDuration * 1000;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = start + (target - start) * eased;
        bulgeRef.current = val;
        setBulge(val);
        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        }
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [transitionDuration],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1 - (e.clientY - rect.top) / rect.height;
      setPointer([Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny))]);
    },
    [],
  );

  const handlePointerEnter = useCallback(() => {
    animateBulge(1);
  }, [animateBulge]);

  const handlePointerLeave = useCallback(() => {
    animateBulge(0);
  }, [animateBulge]);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const brVal =
    typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;
  const cwVal = typeof cardWidth === "number" ? `${cardWidth}px` : cardWidth;

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{
        width,
        height,
      }}
    >
      <div
        ref={cardRef}
        className="relative overflow-hidden"
        style={{
          width: cwVal,
          maxWidth: "100%",
          aspectRatio: `1 / ${aspectRatio}`,
          borderRadius: brVal,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)",
        }}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <Canvas
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
          className="absolute! inset-0 w-full h-full"
        >
          <Scene
            imageSrc={imageSrc}
            radius={radius}
            strength={strength}
            pointer={pointer}
            bulgeAmount={bulge}
            dampening={dampening}
          />
        </Canvas>
        {children && (
          <div className="relative z-10 pointer-events-none">{children}</div>
        )}
      </div>
    </div>
  );
};

WarpedCard.displayName = "WarpedCard";

export default WarpedCard;
