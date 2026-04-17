/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer, RenderTexture, PerspectiveCamera, Text } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

interface TraderData {
  username: string;
  name: string;
  avatarUrl: string | null;
  pnl: string;
  pnlValue: number;
  winRate: string;
  winRateValue: number;
  trades: string;
  tradeCount: number;
  isDeployer?: boolean;
  topTrades: {
    id: string;
    token: string;
    pnlPercent: string;
    tokenImage: string | null;
  }[];
}

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  traderData?: TraderData;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  traderData,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!mounted) return <div className="lanyard-wrapper" />;

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1);
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} traderData={traderData} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

function CardContent({ data }: { data?: TraderData }) {
  const pfp = useTexture(data?.avatarUrl || '/avatar-fallback.svg');
  const logo = useTexture('/logo.png');
  
  // Heatmap calculation logic adapted from LandingContent
  const heatmapCells = useMemo(() => {
    if (!data) return [];
    const seed = data.username.split('').reduce((sum, char, i) => sum + char.charCodeAt(0) * (i + 1), 0);
    return Array.from({ length: 56 }, (_, i) => {
      const wave = Math.sin((seed + i) * 0.73) * 0.5 + 0.5;
      const burst = Math.cos((seed + i * 3) * 0.41) * 0.5 + 0.5;
      const weighted = wave * 0.65 + burst * 0.35;
      const opacity = weighted > 0.72 ? 0.8 : weighted > 0.42 ? 0.4 : 0.1;
      const isGain = (weighted + (data.winRateValue - 50) / 50 * 0.35) > 0.5;
      return { opacity, color: isGain ? '#22c55e' : '#ef4444' };
    });
  }, [data]);

  return (
    <group>
      <mesh>
        <planeGeometry args={[5, 7]} />
        <meshBasicMaterial color="#080c12" />
      </mesh>
      
      {/* PFP */}
      <mesh position={[-1.4, 1.8, 0.01]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={pfp} transparent />
      </mesh>
      
      {/* Name + Handle */}
      <Text position={[0.2, 2.2, 0.01]} fontSize={0.35} color="white" anchorX="left" font="/fonts/Geist-Black.woff">
        {data?.name || 'TRADER'}
      </Text>
      <Text position={[0.2, 1.8, 0.01]} fontSize={0.25} color="#888" anchorX="left" font="/fonts/Geist-Medium.woff">
        @{data?.username || 'unknown'}
      </Text>
      <Text position={[0.2, 1.4, 0.01]} fontSize={0.45} color={data?.pnlValue && data.pnlValue >= 0 ? '#22c55e' : '#ef4444'} anchorX="left" font="/fonts/Geist-Bold.woff">
        {data?.pnl || '$0'}
      </Text>

      {/* Stats */}
      <group position={[-1.7, 0.2, 0.01]}>
        <Text position={[0, 0, 0]} fontSize={0.18} color="#555" anchorX="left">WIN RATE</Text>
        <Text position={[0, -0.25, 0]} fontSize={0.3} color="white" anchorX="left">{data?.winRate || '0%'}</Text>
        
        <Text position={[2, 0, 0]} fontSize={0.18} color="#555" anchorX="left">TRADES</Text>
        <Text position={[2, -0.25, 0]} fontSize={0.3} color="white" anchorX="left">{data?.trades || '0'}</Text>
      </group>

      {/* Heatmap */}
      <group position={[-1.8, -1.2, 0.01]}>
        <Text position={[0, 0.4, 0]} fontSize={0.15} color="#444" anchorX="left" letterSpacing={0.1}>16-WEEK TRADING PULSE</Text>
        {heatmapCells.map((cell, i) => (
          <mesh key={i} position={[(i % 14) * 0.28, -Math.floor(i / 14) * 0.28, 0]}>
            <planeGeometry args={[0.22, 0.22]} />
            <meshBasicMaterial color={cell.color} transparent opacity={cell.opacity} />
          </mesh>
        ))}
      </group>

      {/* Footer Logo */}
      <mesh position={[0, -2.8, 0.01]}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial map={logo} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Band({ maxSpeed = 50, minSpeed = 0, isMobile = false, traderData }: { maxSpeed?: number; minSpeed?: number; isMobile?: boolean, traderData?: TraderData }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const band = useRef<any>(null!);
  const fixed = useRef<any>(null!);
  const j1 = useRef<any>(null!);
  const j2 = useRef<any>(null!);
  const j3 = useRef<any>(null!);
  const card = useRef<any>(null!);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = { type: 'dynamic' as const, canSleep: true, colliders: false as const, angularDamping: 4, linearDamping: 4 };

  const { nodes, materials } = useGLTF('/lanyard/card.glb') as any;
  const originalTexture = useTexture('/lanyard/lanyard.png');
  const logo = useTexture('/logo.png');

  // Create branded strap texture
  const brandedStrap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return originalTexture;

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const logoImg = logo.image as HTMLImageElement;
    const logoAspect = logoImg.width / logoImg.height;
    const logoHeight = 60;
    const logoWidth = logoHeight * logoAspect;
    
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(logoImg, i * 256 + (256 - logoWidth) / 2, (128 - logoHeight) / 2, logoWidth, logoHeight);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }, [logo, originalTexture]);

  const [curve] = useState(() =>
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ])
  );

  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => { document.body.style.cursor = 'auto'; };
    }
    return undefined;
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - (dragged as THREE.Vector3).x,
        y: vec.y - (dragged as THREE.Vector3).y,
        z: vec.z - (dragged as THREE.Vector3).z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0]!.copy(j3.current.translation());
      curve.points[1]!.copy(j2.current.lerped);
      curve.points[2]!.copy(j1.current.lerped);
      curve.points[3]!.copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              >
                <RenderTexture attach="map">
                  <PerspectiveCamera makeDefault manual aspect={5 / 7} position={[0, 0, 5]} />
                  <CardContent data={traderData} />
                </RenderTexture>
              </meshPhysicalMaterial>
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        {/* @ts-expect-error meshline extends THREE namespace at runtime */}
        <meshLineGeometry />
        {/* @ts-expect-error meshline extends THREE namespace at runtime */}
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={brandedStrap}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

