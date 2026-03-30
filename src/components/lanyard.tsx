/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  profile?: {
    username: string;
    name: string;
    avatarUrl: string | null;
    pnl: string;
    winRate: string;
  };
}

export default function Lanyard({
  position = [0, 0, 20],
  gravity = [0, -40, 0],
  fov = 25,
  transparent = true,
  profile,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '450px' }}>
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} profile={profile} />
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

/** Load the logo image and generate branded card texture */
function useCardTexture(profile?: LanyardProps['profile']) {
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/logo.png';
    img.onload = () => setLogoImg(img);
  }, []);

  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    // Dark background
    ctx.fillStyle = '#080c12';
    ctx.fillRect(0, 0, 512, 720);

    // Subtle gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
    grad.addColorStop(0.5, 'transparent');
    grad.addColorStop(1, 'rgba(0, 212, 255, 0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 720);

    // Top accent line
    const lineGrad = ctx.createLinearGradient(60, 0, 452, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, '#00D4FF');
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, 0, 512, 4);

    // Border
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 508, 716);

    // Logo — draw the actual PNG
    if (logoImg) {
      const logoW = 200;
      const logoH = (logoImg.height / logoImg.width) * logoW;
      ctx.drawImage(logoImg, (512 - logoW) / 2, 40, logoW, logoH);
    } else {
      // Fallback text logo
      ctx.fillStyle = '#00D4FF';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TRENCH ID', 256, 70);
    }

    // Thin divider
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(452, 110);
    ctx.stroke();

    // Avatar circle placeholder
    ctx.beginPath();
    ctx.arc(256, 210, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#111318';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Avatar letter
    const initial = profile?.name?.charAt(0).toUpperCase() ?? 'T';
    ctx.fillStyle = '#00D4FF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, 256, 212);
    ctx.textBaseline = 'alphabetic';

    // Username
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    const displayUsername = profile?.username ? `@${profile.username}` : '@you';
    ctx.fillText(displayUsername, 256, 310);

    // Name
    ctx.fillStyle = '#71717a';
    ctx.font = '16px sans-serif';
    ctx.fillText(profile?.name ?? 'Your Name', 256, 340);

    // Verified badge
    ctx.fillStyle = '#00D4FF';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('✓ VERIFIED TRADER', 256, 375);

    // PnL box
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.fillRect(60, 410, 392, 75);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 410, 392, 75);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(profile?.pnl ?? '$???', 256, 450);

    ctx.fillStyle = '#71717a';
    ctx.font = '11px monospace';
    ctx.fillText('TOTAL REALIZED PnL', 256, 475);

    // Stats row
    ctx.fillStyle = 'rgba(0, 212, 255, 0.06)';
    ctx.fillRect(60, 510, 190, 55);
    ctx.fillRect(262, 510, 190, 55);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.strokeRect(60, 510, 190, 55);
    ctx.strokeRect(262, 510, 190, 55);

    ctx.fillStyle = '#00D4FF';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(profile?.winRate ?? '??%', 155, 540);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(profile ? '—' : '???', 357, 540);

    ctx.fillStyle = '#71717a';
    ctx.font = '9px monospace';
    ctx.fillText('WIN RATE', 155, 558);
    ctx.fillText('TRADES', 357, 558);

    // URL bar
    ctx.fillStyle = 'rgba(0, 212, 255, 0.04)';
    ctx.fillRect(60, 600, 392, 35);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.strokeRect(60, 600, 392, 35);

    ctx.fillStyle = '#00D4FF';
    ctx.font = '13px monospace';
    const url = profile?.username ? `trecher-id.vercel.app/${profile.username}` : 'trecher-id.vercel.app/you';
    ctx.fillText(url, 256, 622);

    // Bottom branding
    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.font = '9px monospace';
    ctx.fillText('TRENCH ID · SOLANA · 2026', 256, 690);

    // Bottom accent line
    const botGrad = ctx.createLinearGradient(60, 0, 452, 0);
    botGrad.addColorStop(0, 'transparent');
    botGrad.addColorStop(0.5, '#00D4FF');
    botGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, 716, 512, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.flipY = false;
    return texture;
  }, [profile, logoImg]);
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  profile,
}: {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  profile?: LanyardProps['profile'];
}) {
  const band = useRef<THREE.Mesh>(null!);
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
  const texture = useTexture('/lanyard/lanyard.png');
  const cardTexture = useCardTexture(profile);

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
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
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - (dragged as THREE.Vector3).x,
        y: vec.y - (dragged as THREE.Vector3).y,
        z: vec.z - (dragged as THREE.Vector3).z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      (band.current as any).geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

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
            scale={2.75}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => { e.target.releasePointerCapture(e.pointerId); drag(false); }}
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardTexture}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial
          color="#00D4FF"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
