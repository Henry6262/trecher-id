"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface ColorLoopsProps {
  /** Horizontal center position of ripples (0-1) */
  centerX?: number;

  /** Vertical center position of ripples (0-1) */
  centerY?: number;

  /** Animation speed multiplier */
  speed?: number;

  /** Ripple density/scale (higher = tighter ripples) */
  scale?: number;

  /** Ripple wave intensity (0-1) */
  intensity?: number;

  /** Use symmetric circular ripples vs asymmetric elliptical */
  symmetric?: boolean;

  /** Red channel base color influence (0-1) */
  redInfluence?: number;

  /** Green channel base color influence (0-1) */
  greenInfluence?: number;

  /** Blue channel base color influence (0-1) */
  blueInfluence?: number;

  /** Base color offset - shifts all colors (0 = black base, 1 = white base) */
  baseColor?: number;

  /** Overall opacity (0-1) */
  opacity?: number;

  /** Additional CSS classes */
  className?: string;
}

const ColorLoops: React.FC<ColorLoopsProps> = ({
  centerX = 0.5,
  centerY = 0.5,
  speed = 1.0,
  scale = 1.0,
  intensity = 0.5,
  symmetric = false,
  redInfluence = 1.0,
  greenInfluence = 1.0,
  blueInfluence = 1.0,
  baseColor = 0.0,
  opacity = 1.0,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uCenter: { value: new THREE.Vector2(centerX, centerY) },
        uSpeed: { value: speed * 0.035 },
        uScale: { value: 0.013 / scale },
        uIntensity: { value: intensity },
        uSymmetric: { value: symmetric ? 1.0 : 0.0 },
        uRedInfluence: { value: redInfluence },
        uGreenInfluence: { value: greenInfluence },
        uBlueInfluence: { value: blueInfluence },
        uBaseColor: { value: baseColor },
        uOpacity: { value: opacity },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uCenter;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uIntensity;
        uniform float uSymmetric;
        uniform float uRedInfluence;
        uniform float uGreenInfluence;
        uniform float uBlueInfluence;
        uniform float uBaseColor;
        uniform float uOpacity;

        varying vec2 vUv;

        void main() {
          float invAr = uResolution.y / uResolution.x;

          vec3 col = vec3(uBaseColor) + vec3(
            vUv.x * uRedInfluence,
            vUv.y * uGreenInfluence,
            (1.0 - length(vUv - 0.5) * 1.4) * uBlueInfluence
          );

          float x = uCenter.x - vUv.x;
          float y = (uCenter.y - vUv.y) * invAr;

          float r;
          if (uSymmetric > 0.5) {
            r = -sqrt(x * x + y * y);
          } else {
            r = -(x * x + y * y);
          }

          float z = 1.0 + uIntensity * sin((r + uTime * uSpeed) / uScale);

          vec3 texcol = vec3(z, z, z);
          vec3 finalColor = col * texcol;

          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `,
      transparent: true,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsedTime;

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      renderer.setSize(newWidth, newHeight);
      material.uniforms.uResolution.value.set(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();

      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uCenter.value.set(centerX, centerY);
      materialRef.current.uniforms.uSpeed.value = speed * 0.035;
      materialRef.current.uniforms.uScale.value = 0.013 / scale;
      materialRef.current.uniforms.uIntensity.value = intensity;
      materialRef.current.uniforms.uSymmetric.value = symmetric ? 1.0 : 0.0;
      materialRef.current.uniforms.uRedInfluence.value = redInfluence;
      materialRef.current.uniforms.uGreenInfluence.value = greenInfluence;
      materialRef.current.uniforms.uBlueInfluence.value = blueInfluence;
      materialRef.current.uniforms.uBaseColor.value = baseColor;
      materialRef.current.uniforms.uOpacity.value = opacity;
    }
  }, [
    centerX,
    centerY,
    speed,
    scale,
    intensity,
    symmetric,
    redInfluence,
    greenInfluence,
    blueInfluence,
    baseColor,
    opacity,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full", className)}
      style={{ minHeight: "inherit" }}
    />
  );
};

ColorLoops.displayName = "ColorLoops";

export default ColorLoops;
