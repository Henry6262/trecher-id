"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import * as THREE from "three";

export interface GalleryImage {
  url: string;
  width: number;
  height: number;
}

export interface InfiniteGalleryProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Array of images with url + intrinsic dimensions */
  images?: GalleryImage[];
  /** Number of images per grid cell */
  density?: number;
  /** Base size of each image plane in world units */
  imageSize?: number;
  /** Grid cell size in world units */
  cellSize?: number;
  /** How far (in cells) to render around the camera */
  viewRange?: number;
  /** Fog start distance */
  fogNear?: number;
  /** Fog end distance */
  fogFar?: number;
  /** Drag / scroll sensitivity */
  dragSpeed?: number;
  /** Mouse-follow parallax drift amount */
  driftAmount?: number;
  /** Velocity decay (0 = instant stop, 1 = never stops) */
  friction?: number;
  /** Automatically zoom forward continuously */
  autoZoom?: boolean;
  /** Speed of auto-zoom (world units per frame) */
  autoZoomSpeed?: number;
  /** Border radius on images (0–1, fraction of short edge) */
  imageRadius?: number;
  /** Allow clicking images to focus/zoom on them */
  allowImageFocusOnClick?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Fog color (usually matches background) */
  fogColor?: string;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const rand = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const texCache = new Map<string, THREE.Texture>();
const texLoader = new THREE.TextureLoader();

function loadTex(url: string, onReady?: () => void): THREE.Texture | null {
  const existing = texCache.get(url);
  if (existing) {
    onReady?.();
    return existing;
  }

  texLoader.setCrossOrigin("anonymous");
  texLoader.load(
    url,
    (tex) => {
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      texCache.set(url, tex);
      onReady?.();
    },
    undefined,
    () => {
      console.warn("InfiniteGallery: failed to load", url);
    },
  );
  return null;
}

interface PlaneInfo {
  id: string;
  px: number;
  py: number;
  pz: number;
  size: number;
  imgIdx: number;
}

const planeCache = new Map<string, PlaneInfo[]>();

function generateCell(
  cx: number,
  cy: number,
  cz: number,
  cellSize: number,
  density: number,
  imageSize: number,
): PlaneInfo[] {
  const key = `${cx},${cy},${cz}|${cellSize}|${density}|${imageSize}`;
  const cached = planeCache.get(key);
  if (cached) return cached;

  const seed = hash(key);
  const planes: PlaneInfo[] = [];

  for (let i = 0; i < density; i++) {
    const s = seed + i * 7919;
    const size = imageSize * (0.65 + rand(s + 4) * 0.7);

    planes.push({
      id: `${key}-${i}`,
      px: cx * cellSize + rand(s + 0) * cellSize,
      py: cy * cellSize + rand(s + 1) * cellSize,
      pz: cz * cellSize + rand(s + 2) * cellSize,
      size,
      imgIdx: Math.floor(rand(s + 5) * 1_000_000),
    });
  }

  planeCache.set(key, planes);

  if (planeCache.size > 512) {
    const first = planeCache.keys().next().value;
    if (first !== undefined) planeCache.delete(first);
  }

  return planes;
}

function buildCellOffsets(range: number) {
  const offsets: { dx: number; dy: number; dz: number }[] = [];
  for (let dx = -range; dx <= range; dx++)
    for (let dy = -range; dy <= range; dy++)
      for (let dz = -range; dz <= range; dz++)
        if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) <= range)
          offsets.push({ dx, dy, dz });
  return offsets;
}

const SHARED_GEO = new THREE.PlaneGeometry(1, 1);

const roundedVert = `
varying vec2 vUv;
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const roundedFrag = `
precision highp float;
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uRadius;
uniform vec2 uSize;
varying vec2 vUv;

#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying float vFogDepth;
#endif

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec4 tex = texture2D(uMap, vUv);

  float shortEdge = min(uSize.x, uSize.y);
  float r = uRadius * shortEdge * 0.5;
  vec2 p = (vUv - 0.5) * uSize;
  vec2 halfSize = uSize * 0.5;
  float d = roundedBox(p, halfSize, r);
  float aa = fwidth(d);
  float mask = 1.0 - smoothstep(-aa, aa, d);

  float alpha = mask * uOpacity;

  #ifdef USE_FOG
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    alpha *= 1.0 - fogFactor;
  #endif

  if (alpha < 0.001) discard;
  gl_FragColor = vec4(tex.rgb, alpha);
  #include <colorspace_fragment>
}
`;

interface FocusTarget {
  px: number;
  py: number;
  pz: number;
  scaleX: number;
  scaleY: number;
}

const focusRef: { current: FocusTarget | null } = { current: null };

function ImagePlane({
  info,
  media,
  camRef,
  cellSize,
  viewRange,
  imageRadius,
  onFocus,
}: {
  info: PlaneInfo;
  media: GalleryImage;
  camRef: React.RefObject<{ x: number; y: number; z: number }>;
  cellSize: number;
  viewRange: number;
  imageRadius: number;
  onFocus: ((target: FocusTarget) => void) | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const isFocusedOnMount = (() => {
    const ft = focusRef.current;
    return ft && ft.px === info.px && ft.py === info.py && ft.pz === info.pz;
  })();
  const opRef = useRef(isFocusedOnMount ? 1 : 0);
  const hasTexRef = useRef(false);

  const scale = useMemo(() => {
    const aspect = media.width / media.height;
    return new THREE.Vector3(info.size * aspect, info.size, 1);
  }, [media, info.size]);

  const uniforms = useMemo(
    () =>
      THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uMap: { value: null },
          uOpacity: { value: isFocusedOnMount ? 1 : 0 },
          uRadius: { value: imageRadius },
          uSize: { value: new THREE.Vector2(1, 1) },
        },
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (texCache.has(media.url)) {
      hasTexRef.current = true;
      return;
    }
    loadTex(media.url, () => {
      hasTexRef.current = true;
    });
  }, [media.url]);

  const fadeEnd = cellSize * (viewRange + 1);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    if (!mat.uniforms.uMap.value && hasTexRef.current) {
      const tex = texCache.get(media.url);
      if (tex) {
        mat.uniforms.uMap.value = tex;
        mat.needsUpdate = true;
      }
    }

    if (!mat.uniforms.uMap.value) {
      mesh.visible = false;
      return;
    }

    const cam = camRef.current;
    if (!cam) return;

    const dx = info.px - cam.x;
    const dy = info.py - cam.y;
    const dz = info.pz - cam.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const ft = focusRef.current;
    const isFocused =
      ft && ft.px === info.px && ft.py === info.py && ft.pz === info.pz;
    const target = isFocused || dist < fadeEnd ? 1 : 0;
    opRef.current = isFocused ? 1 : lerp(opRef.current, target, 0.12);

    mat.uniforms.uOpacity.value = opRef.current;
    mat.uniforms.uRadius.value = imageRadius;
    mat.uniforms.uSize.value.set(scale.x, scale.y);
    mesh.visible = opRef.current > 0.01;

    mesh.renderOrder = isFocused ? 999 : 0;
    mat.depthTest = !isFocused;
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!onFocus) return;
      e.stopPropagation();
      onFocus({
        px: info.px,
        py: info.py,
        pz: info.pz,
        scaleX: scale.x,
        scaleY: scale.y,
      });
    },
    [info, scale, onFocus],
  );

  return (
    <mesh
      ref={meshRef}
      geometry={SHARED_GEO}
      position={[info.px, info.py, info.pz]}
      scale={scale}
      visible={false}
      onClick={handleClick}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={roundedVert}
        fragmentShader={roundedFrag}
        transparent
        depthWrite={false}
        fog
        side={THREE.DoubleSide}
        uniforms={uniforms}
      />
    </mesh>
  );
}

interface CellKey {
  key: string;
  cx: number;
  cy: number;
  cz: number;
}

function GalleryCell({
  cx,
  cy,
  cz,
  images,
  cellSize,
  density,
  imageSize,
  camRef,
  viewRange,
  imageRadius,
  onFocus,
}: {
  cx: number;
  cy: number;
  cz: number;
  images: GalleryImage[];
  cellSize: number;
  density: number;
  imageSize: number;
  camRef: React.RefObject<{ x: number; y: number; z: number }>;
  viewRange: number;
  imageRadius: number;
  onFocus: ((target: FocusTarget) => void) | null;
}) {
  const planes = useMemo(
    () => generateCell(cx, cy, cz, cellSize, density, imageSize),
    [cx, cy, cz, cellSize, density, imageSize],
  );

  return (
    <>
      {planes.map((p) => {
        const img = images[p.imgIdx % images.length];
        if (!img) return null;
        return (
          <ImagePlane
            key={p.id}
            info={p}
            media={img}
            camRef={camRef}
            cellSize={cellSize}
            viewRange={viewRange}
            imageRadius={imageRadius}
            onFocus={onFocus}
          />
        );
      })}
    </>
  );
}

interface ControllerProps {
  images: GalleryImage[];
  cellSize: number;
  density: number;
  imageSize: number;
  viewRange: number;
  dragSpeed: number;
  driftAmount: number;
  friction: number;
  autoZoom: boolean;
  autoZoomSpeed: number;
  imageRadius: number;
  allowFocus: boolean;
}

function Controller({
  images,
  cellSize,
  density,
  imageSize,
  viewRange,
  dragSpeed,
  driftAmount,
  friction,
  autoZoom,
  autoZoomSpeed,
  imageRadius,
  allowFocus,
}: ControllerProps) {
  const { camera, gl } = useThree();
  const offsets = useMemo(() => buildCellOffsets(viewRange + 1), [viewRange]);

  const state = useRef({
    vel: { x: 0, y: 0, z: 0 },
    tgt: { x: 0, y: 0, z: 0 },
    pos: { x: 0, y: 0, z: 50 },
    drift: { x: 0, y: 0 },
    mouse: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 },
    dragging: false,
    scrollAccum: 0,
    lastKey: "",
    lastTouches: [] as Touch[],
    lastTouchDist: 0,
    focused: false,
    focusTarget: null as FocusTarget | null,
    focusLerp: 0,
    preFocusPos: { x: 0, y: 0, z: 0 },
    dragDistSq: 0,
  });

  const camRef = useRef({ x: 0, y: 0, z: 50 });
  const [cells, setCells] = useState<CellKey[]>([]);

  const handleFocus = useCallback((target: FocusTarget) => {
    const s = state.current;
    if (s.dragDistSq > 16) return;

    if (s.focused && s.focusTarget) {
      const ft = s.focusTarget;
      if (ft.px === target.px && ft.py === target.py && ft.pz === target.pz) {
        s.focused = false;
        s.focusTarget = null;
        focusRef.current = null;
        return;
      }
      s.focusTarget = target;
      focusRef.current = target;
      s.vel = { x: 0, y: 0, z: 0 };
      s.tgt = { x: 0, y: 0, z: 0 };
      s.scrollAccum = 0;
      return;
    }

    s.focused = true;
    s.focusTarget = target;
    focusRef.current = target;
    s.preFocusPos = { ...s.pos };
    s.vel = { x: 0, y: 0, z: 0 };
    s.tgt = { x: 0, y: 0, z: 0 };
    s.scrollAccum = 0;
  }, []);

  const handleBgClick = useCallback(() => {
    const s = state.current;
    if (s.focused) {
      s.focused = false;
      s.focusTarget = null;
      focusRef.current = null;
    }
  }, []);

  useEffect(() => {
    const s = state.current;
    s.pos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };
    const cx0 = Math.floor(s.pos.x / cellSize);
    const cy0 = Math.floor(s.pos.y / cellSize);
    const cz0 = Math.floor(s.pos.z / cellSize);
    setCells(
      offsets.map((o) => ({
        key: `${cx0 + o.dx},${cy0 + o.dy},${cz0 + o.dz}`,
        cx: cx0 + o.dx,
        cy: cy0 + o.dy,
        cz: cz0 + o.dz,
      })),
    );
  }, [camera, cellSize, offsets]);

  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;

    const onDown = (e: MouseEvent) => {
      s.dragging = true;
      s.lastMouse = { x: e.clientX, y: e.clientY };
      s.dragDistSq = 0;
    };
    const onUp = () => {
      s.dragging = false;
    };
    const onMove = (e: MouseEvent) => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      s.mouse = {
        x: (e.clientX / w) * 2 - 1,
        y: -(e.clientY / h) * 2 + 1,
      };
      if (s.dragging) {
        const ddx = e.clientX - s.lastMouse.x;
        const ddy = e.clientY - s.lastMouse.y;
        s.dragDistSq += ddx * ddx + ddy * ddy;
        if (s.focused) {
          if (s.dragDistSq > 16) {
            s.focused = false;
            s.focusTarget = null;
            focusRef.current = null;
          }
        } else {
          s.tgt.x -= ddx * dragSpeed * 0.025;
          s.tgt.y += ddy * dragSpeed * 0.025;
        }
        s.lastMouse = { x: e.clientX, y: e.clientY };
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (s.focused) {
        s.focused = false;
        s.focusTarget = null;
        focusRef.current = null;
      }
      s.scrollAccum += e.deltaY * 0.006;
    };

    const touchDist = (ts: Touch[]) => {
      if (ts.length < 2) return 0;
      const dx = ts[0].clientX - ts[1].clientX;
      const dy = ts[0].clientY - ts[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const onTS = (e: TouchEvent) => {
      e.preventDefault();
      s.lastTouches = Array.from(e.touches) as Touch[];
      s.lastTouchDist = touchDist(s.lastTouches);
    };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      const ts = Array.from(e.touches) as Touch[];
      if (ts.length === 1 && s.lastTouches.length >= 1) {
        const t = ts[0],
          l = s.lastTouches[0];
        if (t && l) {
          if (s.focused) {
            s.focused = false;
            s.focusTarget = null;
            focusRef.current = null;
          }
          s.tgt.x -= (t.clientX - l.clientX) * dragSpeed * 0.02;
          s.tgt.y += (t.clientY - l.clientY) * dragSpeed * 0.02;
        }
      } else if (ts.length === 2 && s.lastTouchDist > 0) {
        const d = touchDist(ts);
        if (s.focused) {
          s.focused = false;
          s.focusTarget = null;
          focusRef.current = null;
        }
        s.scrollAccum += (s.lastTouchDist - d) * 0.006;
        s.lastTouchDist = d;
      }
      s.lastTouches = ts;
    };
    const onTE = (e: TouchEvent) => {
      s.lastTouches = Array.from(e.touches) as Touch[];
      s.lastTouchDist = touchDist(s.lastTouches);
    };
    const onLeave = () => {
      s.mouse = { x: 0, y: 0 };
      s.dragging = false;
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTS, { passive: false });
    el.addEventListener("touchmove", onTM, { passive: false });
    el.addEventListener("touchend", onTE, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTS);
      el.removeEventListener("touchmove", onTM);
      el.removeEventListener("touchend", onTE);
    };
  }, [gl, dragSpeed]);

  useFrame(() => {
    const s = state.current;

    if (s.focused && s.focusTarget) {
      const ft = s.focusTarget;
      const viewDist = Math.max(ft.scaleX, ft.scaleY) * 1.2;
      const goalX = ft.px;
      const goalY = ft.py;
      const goalZ = ft.pz + viewDist;

      s.pos.x = lerp(s.pos.x, goalX, 0.08);
      s.pos.y = lerp(s.pos.y, goalY, 0.08);
      s.pos.z = lerp(s.pos.z, goalZ, 0.08);

      s.drift.x = lerp(s.drift.x, 0, 0.15);
      s.drift.y = lerp(s.drift.y, 0, 0.15);

      camera.position.set(s.pos.x + s.drift.x, s.pos.y + s.drift.y, s.pos.z);

      s.vel = { x: 0, y: 0, z: 0 };
      s.tgt = { x: 0, y: 0, z: 0 };
      s.scrollAccum = 0;

      camRef.current = { x: s.pos.x, y: s.pos.y, z: s.pos.z };

      const cx = Math.floor(s.pos.x / cellSize);
      const cy = Math.floor(s.pos.y / cellSize);
      const cz = Math.floor(s.pos.z / cellSize);
      const key = `${cx},${cy},${cz}`;
      if (key !== s.lastKey) {
        s.lastKey = key;
        setCells(
          offsets.map((o) => ({
            key: `${cx + o.dx},${cy + o.dy},${cz + o.dz}`,
            cx: cx + o.dx,
            cy: cy + o.dy,
            cz: cz + o.dz,
          })),
        );
      }
      return;
    }

    const maxVel = 3.2;
    const vLerp = 0.16;
    const zoomF = clamp(s.pos.z / 50, 0.3, 2.0);

    if (!s.dragging) {
      s.drift.x = lerp(s.drift.x, s.mouse.x * driftAmount * zoomF, 0.12);
      s.drift.y = lerp(s.drift.y, s.mouse.y * driftAmount * zoomF, 0.12);
    }

    s.tgt.z += s.scrollAccum;
    s.scrollAccum *= 0.8;

    if (autoZoom) {
      s.pos.z -= autoZoomSpeed;
    }

    s.tgt.x = clamp(s.tgt.x, -maxVel, maxVel);
    s.tgt.y = clamp(s.tgt.y, -maxVel, maxVel);
    s.tgt.z = clamp(s.tgt.z, -maxVel, maxVel);

    s.vel.x = lerp(s.vel.x, s.tgt.x, vLerp);
    s.vel.y = lerp(s.vel.y, s.tgt.y, vLerp);
    s.vel.z = lerp(s.vel.z, s.tgt.z, vLerp);

    s.pos.x += s.vel.x;
    s.pos.y += s.vel.y;
    s.pos.z += s.vel.z;

    camera.position.set(s.pos.x + s.drift.x, s.pos.y + s.drift.y, s.pos.z);

    s.tgt.x *= friction;
    s.tgt.y *= friction;
    s.tgt.z *= friction;

    camRef.current = { x: s.pos.x, y: s.pos.y, z: s.pos.z };

    const cx = Math.floor(s.pos.x / cellSize);
    const cy = Math.floor(s.pos.y / cellSize);
    const cz = Math.floor(s.pos.z / cellSize);
    const key = `${cx},${cy},${cz}`;

    if (key !== s.lastKey) {
      s.lastKey = key;
      setCells(
        offsets.map((o) => ({
          key: `${cx + o.dx},${cy + o.dy},${cz + o.dz}`,
          cx: cx + o.dx,
          cy: cy + o.dy,
          cz: cz + o.dz,
        })),
      );
    }
  });

  return (
    <>
      {allowFocus && (
        <mesh
          position={[
            camera.position.x,
            camera.position.y,
            camera.position.z - 400,
          ]}
          onClick={handleBgClick}
        >
          <planeGeometry args={[10000, 10000]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      {cells.map((c) => (
        <GalleryCell
          key={c.key}
          cx={c.cx}
          cy={c.cy}
          cz={c.cz}
          images={images}
          cellSize={cellSize}
          density={density}
          imageSize={imageSize}
          camRef={camRef}
          viewRange={viewRange}
          imageRadius={imageRadius}
          onFocus={allowFocus ? handleFocus : null}
        />
      ))}
    </>
  );
}

const DEFAULT_IMAGES: GalleryImage[] = [
  {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=75",
    width: 600,
    height: 400,
  },
  {
    url: "https://images.unsplash.com/photo-1465056836900-8f1e4f32c1f6?w=600&q=75",
    width: 600,
    height: 338,
  },
];

const getDpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
const subscribeDpr = (cb: () => void) => {
  const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  mql.addEventListener("change", cb, { once: true });
  return () => mql.removeEventListener("change", cb);
};
const serverDpr = () => 1;

const normalizeHex = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? `#${m[1]}${m[2]}${m[3]}` : "#ffffff";
};

const InfiniteGallery: React.FC<InfiniteGalleryProps> = ({
  width = "100%",
  height = "100%",
  className,
  images,
  density = 5,
  imageSize = 14,
  cellSize = 110,
  viewRange = 2,
  fogNear = 120,
  fogFar = 320,
  dragSpeed = 1,
  driftAmount = 8,
  friction = 0.9,
  autoZoom = false,
  autoZoomSpeed = 0.5,
  imageRadius = 0.06,
  allowImageFocusOnClick = true,
  backgroundColor = "#000000",
  fogColor = "#000000",
}) => {
  const imgs = images && images.length > 0 ? images : DEFAULT_IMAGES;
  const bg = normalizeHex(backgroundColor);
  const fg = normalizeHex(fogColor);

  const dpr = useSyncExternalStore(subscribeDpr, getDpr, serverDpr);

  return (
    <div
      className={cn("relative overflow-hidden touch-none", className)}
      style={{ width, height }}
    >
      <Canvas
        className="absolute inset-0 h-full w-full"
        camera={{
          position: [0, 0, 50],
          fov: 60,
          near: 1,
          far: 500,
        }}
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[fg, fogNear, fogFar]} />
        <Controller
          images={imgs}
          cellSize={cellSize}
          density={density}
          imageSize={imageSize}
          viewRange={viewRange}
          dragSpeed={dragSpeed}
          driftAmount={driftAmount}
          friction={friction}
          autoZoom={autoZoom}
          autoZoomSpeed={autoZoomSpeed}
          imageRadius={imageRadius}
          allowFocus={allowImageFocusOnClick}
        />
      </Canvas>
    </div>
  );
};

InfiniteGallery.displayName = "InfiniteGallery";

export default InfiniteGallery;
