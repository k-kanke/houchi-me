'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function Particles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const palette = useMemo(
    () => [
      new THREE.Color('#a378ff'),
      new THREE.Color('#4ff5e7'),
      new THREE.Color('#ff6ec7'),
      new THREE.Color('#ffc774'),
    ],
    [],
  );

  const { positions, colors, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 6 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.004;
      velocities[i * 3 + 1] = 0.002 + Math.random() * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }
    return { positions, colors, velocities };
  }, [count, palette]);

  useFrame(() => {
    if (!ref.current) return;
    const geo = ref.current.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] += velocities[i * 3 + 0];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (arr[i * 3 + 1] > 7) {
        arr[i * 3 + 1] = 0.4;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 20;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
