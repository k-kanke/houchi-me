'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function Bookshelf({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const books = useMemo(() => {
    const arr: { x: number; y: number; h: number; color: string }[] = [];
    const palette = ['#a378ff', '#4ff5e7', '#ff6ec7', '#ffc774', '#74ffa8'];
    for (let row = 0; row < 4; row++) {
      let x = -1.4;
      while (x < 1.4) {
        const w = 0.06 + Math.random() * 0.08;
        const h = 0.22 + Math.random() * 0.08;
        arr.push({
          x: x + w / 2,
          y: 0.45 + row * 0.36,
          h,
          color: palette[Math.floor(Math.random() * palette.length)],
        });
        x += w + 0.01;
      }
    }
    return arr;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* shelf frame - translucent */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[3.2, 2.0, 0.35]} />
        <meshStandardMaterial
          color="#1a1736"
          transparent
          opacity={0.22}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* shelf horizontals */}
      {[0.4, 0.78, 1.16, 1.54, 1.92].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[3.0, 0.02, 0.32]} />
          <meshStandardMaterial
            color="#a378ff"
            emissive="#a378ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
      {/* books */}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.08]}>
          <boxGeometry args={[0.07, b.h, 0.18]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}
    </group>
  );
}

function CentralDesk() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ringRef.current) ringRef.current.rotation.z = s.clock.elapsedTime * 0.25;
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 1.6, 0.05, 64]} />
        <meshStandardMaterial
          color="#160f30"
          emissive="#4ff5e7"
          emissiveIntensity={0.06}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.02, 8, 96]} />
        <meshStandardMaterial
          color="#4ff5e7"
          emissive="#4ff5e7"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.012, 8, 96]} />
        <meshStandardMaterial
          color="#a378ff"
          emissive="#a378ff"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function FloatingNote({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.2;
    ref.current.rotation.y = t * 0.3;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[0.6, 0.05, 0.42]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <planeGeometry args={[0.5, 0.32]} />
        <meshBasicMaterial color="#06060c" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Skylight() {
  return (
    <group position={[0, 6, -5.2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.6, 64]} />
        <meshBasicMaterial
          color="#a378ff"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 64]} />
        <meshBasicMaterial color="#0a0820" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Stars() {
  const points = useMemo(() => {
    const positions = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const r = 25 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = 6 + r * Math.cos(phi) * 0.5;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 5;
    }
    return positions;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
          count={400}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffffff"
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

function GridFloor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial
          color="#06060c"
          emissive="#0a0820"
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.7}
        />
      </mesh>
      <gridHelper args={[28, 28, '#a378ff', '#1a1540']} position={[0, 0, 0]} />
      {/* central glowing platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.0, 2.2, 64]} />
        <meshBasicMaterial color="#4ff5e7" transparent opacity={0.4} />
      </mesh>
    </>
  );
}

function Horizon() {
  return (
    <mesh position={[0, 8, 0]}>
      <sphereGeometry args={[40, 32, 16]} />
      <meshBasicMaterial
        color="#0a0820"
        side={THREE.BackSide}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

export default function Library() {
  return (
    <>
      <Horizon />
      <Stars />
      <Skylight />
      <GridFloor />
      <CentralDesk />
      {/* east bookshelves */}
      <Bookshelf position={[6.5, 0, 0]} rotation={-Math.PI / 2} />
      <Bookshelf position={[6.5, 0, 3.2]} rotation={-Math.PI / 2} />
      <Bookshelf position={[6.5, 0, -3.2]} rotation={-Math.PI / 2} />
      {/* west bookshelves */}
      <Bookshelf position={[-6.5, 0, 0]} rotation={Math.PI / 2} />
      <Bookshelf position={[-6.5, 0, 3.2]} rotation={Math.PI / 2} />
      <Bookshelf position={[-6.5, 0, -3.2]} rotation={Math.PI / 2} />
      {/* meeting hall area markers */}
      <mesh
        position={[0, 0.02, 5.0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.3, 1.5, 48]} />
        <meshBasicMaterial color="#ff6ec7" transparent opacity={0.5} />
      </mesh>
      {/* floating notes */}
      <FloatingNote position={[-2.2, 1.8, -1.5]} color="#a378ff" />
      <FloatingNote position={[2.4, 2.2, -2.0]} color="#4ff5e7" />
      <FloatingNote position={[-1.5, 2.6, 2.2]} color="#ff6ec7" />
      <FloatingNote position={[1.9, 1.7, 2.5]} color="#ffc774" />
    </>
  );
}
