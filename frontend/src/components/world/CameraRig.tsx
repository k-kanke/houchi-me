'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useAppStore } from '@/lib/store';

export default function CameraRig() {
  const avatars = useAppStore((s) => s.worldAvatars);
  const { camera } = useThree();
  const lookRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mira = avatars[0]
      ? new THREE.Vector3(
          avatars[0].position[0],
          avatars[0].position[1],
          avatars[0].position[2],
        )
      : new THREE.Vector3(0, 0, 0);
    const angle = t * 0.05;
    const pos = new THREE.Vector3(
      mira.x + Math.sin(angle) * 4.5,
      mira.y + 2.4,
      mira.z + Math.cos(angle) * 4.5,
    );
    const look = new THREE.Vector3(mira.x, mira.y + 0.9, mira.z);
    camera.position.lerp(pos, 0.06);
    lookRef.current.lerp(look, 0.06);
    camera.lookAt(lookRef.current);
  });

  return null;
}
