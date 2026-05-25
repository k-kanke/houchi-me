'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useAppStore } from '@/lib/store';
import type { CameraMode } from '@/types';

const TARGETS: Record<
  CameraMode,
  (t: number, mira: THREE.Vector3) => { pos: THREE.Vector3; look: THREE.Vector3 }
> = {
  follow: (t, mira) => {
    const angle = t * 0.05;
    return {
      pos: new THREE.Vector3(
        mira.x + Math.sin(angle) * 4.5,
        mira.y + 2.4,
        mira.z + Math.cos(angle) * 4.5,
      ),
      look: new THREE.Vector3(mira.x, mira.y + 0.9, mira.z),
    };
  },
  orbit: (t) => {
    const r = 10;
    return {
      pos: new THREE.Vector3(Math.sin(t * 0.15) * r, 4, Math.cos(t * 0.15) * r),
      look: new THREE.Vector3(0, 0.6, 0),
    };
  },
  top: () => ({
    pos: new THREE.Vector3(0, 14, 0.001),
    look: new THREE.Vector3(0, 0, 0),
  }),
  cinema: (t) => ({
    pos: new THREE.Vector3(
      6 + Math.sin(t * 0.3) * 1.2,
      2.4 + Math.sin(t * 0.4) * 0.4,
      6 + Math.cos(t * 0.25) * 1.0,
    ),
    look: new THREE.Vector3(
      Math.sin(t * 0.2) * 0.6,
      0.9,
      Math.cos(t * 0.18) * 0.6,
    ),
  }),
};

export default function CameraRig() {
  const mode = useAppStore((s) => s.cameraMode);
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
    const { pos, look } = TARGETS[mode](t, mira);
    camera.position.lerp(pos, 0.06);
    lookRef.current.lerp(look, 0.06);
    camera.lookAt(lookRef.current);
  });

  return null;
}
