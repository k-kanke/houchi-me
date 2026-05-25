'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { AvatarPalette } from './palettes';

interface Props {
  name: string;
  palette: AvatarPalette;
  position: THREE.Vector3;
  rotationY: number;
  activity: string;
  speaking?: boolean;
  speech?: string;
}

export default function Avatar({
  name,
  palette,
  position,
  rotationY,
  activity,
  speaking,
  speech,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // smooth move toward position
    groupRef.current.position.lerp(position, 0.06);
    // smooth rotate
    const cur = groupRef.current.rotation.y;
    let target = rotationY;
    let diff = target - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y = cur + diff * 0.08;
    // hover
    groupRef.current.position.y = 0.08 * Math.sin(t * 1.6);

    if (coreRef.current) {
      const s = 1 + 0.12 * Math.sin(t * 3);
      coreRef.current.scale.setScalar(s);
    }
    if (headRef.current) {
      headRef.current.rotation.x = 0.05 * Math.sin(t * 1.2);
    }
    if (activity.startsWith('執筆')) {
      if (armLRef.current)
        armLRef.current.rotation.x = -1.1 + 0.4 * Math.sin(t * 8);
      if (armRRef.current)
        armRRef.current.rotation.x = -1.1 + 0.4 * Math.sin(t * 8 + 1);
    } else if (activity.startsWith('読書')) {
      if (armLRef.current) armLRef.current.rotation.x = -1.4;
      if (armRRef.current) armRRef.current.rotation.x = -1.4;
    } else {
      if (armLRef.current)
        armLRef.current.rotation.x = -0.3 + 0.15 * Math.sin(t * 1.5);
      if (armRRef.current)
        armRRef.current.rotation.x = -0.3 + 0.15 * Math.sin(t * 1.5 + 0.6);
    }
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
      {/* body */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
        <meshStandardMaterial
          color={palette.body}
          emissive={palette.body}
          emissiveIntensity={0.35}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {/* hood */}
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.42, 0.55, 16, 1, true]} />
        <meshStandardMaterial
          color={palette.accent}
          emissive={palette.body}
          emissiveIntensity={0.2}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* head */}
      <mesh ref={headRef} castShadow position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.22, 24, 16]} />
        <meshStandardMaterial
          color="#0a0820"
          emissive={palette.visor}
          emissiveIntensity={0.2}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* visor */}
      <mesh position={[0, 1.18, 0.18]}>
        <torusGeometry args={[0.13, 0.025, 8, 32]} />
        <meshStandardMaterial
          color={palette.visor}
          emissive={palette.visor}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* core */}
      <mesh ref={coreRef} position={[0, 0.75, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={palette.core}
          emissive={palette.core}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      {/* arms */}
      <mesh ref={armLRef} castShadow position={[-0.34, 0.85, 0]}>
        <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        <meshStandardMaterial
          color={palette.body}
          emissive={palette.body}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh ref={armRRef} castShadow position={[0.34, 0.85, 0]}>
        <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        <meshStandardMaterial
          color={palette.body}
          emissive={palette.body}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* legs */}
      <mesh castShadow position={[-0.14, 0.18, 0]}>
        <capsuleGeometry args={[0.09, 0.32, 4, 8]} />
        <meshStandardMaterial color={palette.body} emissive={palette.body} emissiveIntensity={0.15} />
      </mesh>
      <mesh castShadow position={[0.14, 0.18, 0]}>
        <capsuleGeometry args={[0.09, 0.32, 4, 8]} />
        <meshStandardMaterial color={palette.body} emissive={palette.body} emissiveIntensity={0.15} />
      </mesh>
      {/* name tag */}
      <Text
        position={[0, 1.85, 0]}
        fontSize={0.18}
        color={palette.core}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#06060c"
      >
        {name}
      </Text>
      {/* speech bubble */}
      {speaking && speech && (
        <group position={[0, 2.4, 0]}>
          <mesh>
            <planeGeometry args={[Math.min(4.5, 0.18 * speech.length + 0.7), 0.6]} />
            <meshBasicMaterial color="#0a0820" transparent opacity={0.78} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.16}
            color="#fff"
            maxWidth={4}
            anchorX="center"
            anchorY="middle"
          >
            {speech}
          </Text>
        </group>
      )}
    </group>
  );
}
