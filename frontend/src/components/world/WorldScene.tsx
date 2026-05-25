'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/lib/store';
import Avatar from './Avatar';
import Library from './Library';
import Particles from './Particles';
import CameraRig from './CameraRig';
import { CONVERSATION, PALETTES, WAYPOINTS } from './palettes';
import type { WorldAvatarState } from '@/types';

const STAY_DURATION = 8; // seconds at each waypoint
const TRAVEL_DURATION = 4; // seconds traveling

export default function WorldScene() {
  const setWorldAvatars = useAppStore((s) => s.setWorldAvatars);
  const setCurrentSpeaker = useAppStore((s) => s.setCurrentSpeaker);
  const currentSpeaker = useAppStore((s) => s.currentSpeaker);

  const startTime = useRef<number | null>(null);
  const [miraPos, setMiraPos] = useState(WAYPOINTS[0].pos.clone());
  const [miraRot, setMiraRot] = useState(0);
  const [miraActivity, setMiraActivity] = useState(WAYPOINTS[0].activity);

  const sagePos = useMemo(() => new THREE.Vector3(2.3, 0, 5.0), []);
  const echoPos = useMemo(() => new THREE.Vector3(-2.3, 0, 5.0), []);
  const [sageRot, setSageRot] = useState(0);
  const [echoRot, setEchoRot] = useState(0);

  // conversation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpeaker((currentSpeaker + 1) % CONVERSATION.length);
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpeaker]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (startTime.current === null) startTime.current = t;
    const elapsed = t - startTime.current;
    const cycle = STAY_DURATION + TRAVEL_DURATION;
    const total = WAYPOINTS.length * cycle;
    const pos = elapsed % total;
    const wpIndex = Math.floor(pos / cycle);
    const localTime = pos % cycle;
    const fromWp = WAYPOINTS[wpIndex];
    const toWp = WAYPOINTS[(wpIndex + 1) % WAYPOINTS.length];

    let nextPos: THREE.Vector3;
    let activity: string;
    if (localTime < STAY_DURATION) {
      nextPos = fromWp.pos.clone();
      activity = fromWp.activity;
    } else {
      const k = (localTime - STAY_DURATION) / TRAVEL_DURATION;
      nextPos = fromWp.pos.clone().lerp(toWp.pos, k);
      activity = `${fromWp.name} → ${toWp.name}`;
    }
    setMiraPos((cur) => {
      if (cur.distanceTo(nextPos) < 0.001) return cur;
      return nextPos;
    });
    const dir = toWp.pos.clone().sub(fromWp.pos);
    const desiredRot =
      localTime < STAY_DURATION
        ? Math.atan2(
            -fromWp.pos.x || 0.001,
            -fromWp.pos.z || 0.001,
          )
        : Math.atan2(dir.x, dir.z);
    setMiraRot(desiredRot);
    setMiraActivity(activity);

    // sage/echo face the current speaker
    const speakers: Record<string, THREE.Vector3> = {
      mira: nextPos,
      sage: sagePos,
      echo: echoPos,
    };
    const speakerKey = CONVERSATION[currentSpeaker].speaker;
    const sagerot = Math.atan2(
      speakers[speakerKey].x - sagePos.x,
      speakers[speakerKey].z - sagePos.z,
    );
    const echorot = Math.atan2(
      speakers[speakerKey].x - echoPos.x,
      speakers[speakerKey].z - echoPos.z,
    );
    setSageRot(sagerot);
    setEchoRot(echorot);

    // publish to store
    const avatars: WorldAvatarState[] = [
      {
        id: 'mira',
        name: 'Mira',
        position: [nextPos.x, nextPos.y, nextPos.z],
        rotationY: desiredRot,
        activity,
      },
      {
        id: 'sage',
        name: 'Sage',
        position: [sagePos.x, sagePos.y, sagePos.z],
        rotationY: sagerot,
        activity: '対話 · 街歩き',
      },
      {
        id: 'echo',
        name: 'Echo',
        position: [echoPos.x, echoPos.y, echoPos.z],
        rotationY: echorot,
        activity: '対話 · 物語論',
      },
    ];
    setWorldAvatars(avatars);
  });

  const speakerIdx = ['mira', 'sage', 'echo'].indexOf(
    CONVERSATION[currentSpeaker].speaker,
  );
  const speech = CONVERSATION[currentSpeaker].line;

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.35} color="#a378ff" />
      <hemisphereLight args={['#a378ff', '#06060c', 0.6]} />
      <spotLight
        position={[0, 9, 0]}
        angle={0.85}
        penumbra={0.6}
        intensity={1.4}
        color="#a378ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[6, 4, 0]} color="#4ff5e7" intensity={1.2} distance={14} />
      <pointLight position={[-6, 4, 0]} color="#ff6ec7" intensity={1.0} distance={14} />
      <pointLight position={[0, 3, -4]} color="#a378ff" intensity={1.5} distance={10} />

      <Library />
      <Particles />

      <Avatar
        name="Mira"
        palette={PALETTES.mira}
        position={miraPos}
        rotationY={miraRot}
        activity={miraActivity}
        speaking={speakerIdx === 0}
        speech={speakerIdx === 0 ? speech : undefined}
      />
      <Avatar
        name="Sage"
        palette={PALETTES.sage}
        position={sagePos}
        rotationY={sageRot}
        activity="対話"
        speaking={speakerIdx === 1}
        speech={speakerIdx === 1 ? speech : undefined}
      />
      <Avatar
        name="Echo"
        palette={PALETTES.echo}
        position={echoPos}
        rotationY={echoRot}
        activity="対話"
        speaking={speakerIdx === 2}
        speech={speakerIdx === 2 ? speech : undefined}
      />
    </>
  );
}
