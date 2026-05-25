'use client';

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useAppStore } from '@/lib/store';
import { getActiveRooms, type Room } from './palettes';

function ThemeProp({ room }: { room: Room }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.3;
  });

  if (room.shape === 'barbell') {
    // バーベル（中央バー + 両端のプレート）
    return (
      <group ref={ref}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 16]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.6, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.16, 24]} />
            <meshStandardMaterial
              color={room.color}
              emissive={room.color}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (room.shape === 'mountain') {
    // 山のシルエット（円錐）
    return (
      <group ref={ref}>
        <mesh position={[0, 0.5, 0]}>
          <coneGeometry args={[0.7, 1.6, 4]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.35}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <coneGeometry args={[0.18, 0.4, 4]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
      </group>
    );
  }

  if (room.shape === 'guitar') {
    // ギターっぽいシルエット（縦長楕円 + ネック）
    return (
      <group ref={ref}>
        <mesh position={[0, 0.5, 0]} scale={[0.7, 1, 0.3]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.0, 12]} />
          <meshStandardMaterial color="#d6b58a" emissive="#7a5a3a" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }

  if (room.shape === 'rings') {
    return (
      <group ref={ref}>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.06, 12, 32]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.55}
          />
        </mesh>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, Math.PI / 3, 0]}>
          <torusGeometry args={[0.7, 0.05, 12, 32]} />
          <meshStandardMaterial
            color="#ffd6ec"
            emissive="#ff6ec7"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    );
  }

  if (room.shape === 'cup') {
    // カフェ：カップ + 蒸気
    return (
      <group ref={ref}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.35, 0.28, 0.55, 24]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, 0.74, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.04, 12, 24]} />
          <meshStandardMaterial color="#3a2a1a" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 0.12, 1.1 + i * 0.18, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial
              color="#ffe0a8"
              transparent
              opacity={0.5 - i * 0.12}
              emissive="#ffd9a8"
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (room.shape === 'lens') {
    // カメラ：ボディ + レンズ
    return (
      <group ref={ref}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.9, 0.55, 0.4]} />
          <meshStandardMaterial
            color="#2a2740"
            emissive={room.color}
            emissiveIntensity={0.25}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.5, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.3, 24]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.5}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0.32, 0.78, -0.05]}>
          <boxGeometry args={[0.18, 0.1, 0.1]} />
          <meshStandardMaterial color="#1a1736" />
        </mesh>
      </group>
    );
  }

  if (room.shape === 'reel') {
    // 韓ドラ：フィルムリール 2 つ重ね
    return (
      <group ref={ref}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.45}
          />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.06, 32]} />
          <meshStandardMaterial color="#1a1736" />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.45}
          />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (room.shape === 'plate') {
    // 料理：皿 + 食べ物
    return (
      <group ref={ref}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.6, 0.55, 0.06, 32]} />
          <meshStandardMaterial color="#f0e8d8" emissive="#fff" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[0.2, 0.5, 0.15]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#74ffa8" emissive="#74ffa8" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }

  if (room.shape === 'compass') {
    // 旅：コンパス（円盤 + 針）
    return (
      <group ref={ref}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
          <meshStandardMaterial
            color={room.color}
            emissive={room.color}
            emissiveIntensity={0.4}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.4, 4]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.4, 4]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }

  // generic：光る球
  return (
    <group ref={ref}>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial
          color={room.color}
          emissive={room.color}
          emissiveIntensity={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function RoomGate({ room }: { room: Room }) {
  // 図書館（原点）から見た時の入口位置: 部屋から原点方向に少しオフセット
  const dirToCenter = new THREE.Vector3(-room.pos.x, 0, -room.pos.z).normalize();
  // 入口側に対して垂直な方向（柱の左右オフセット用）
  const perp = new THREE.Vector3(-dirToCenter.z, 0, dirToCenter.x);
  // 入口の中心はリング外周(半径3.2)よりわずかに内側
  const gateOffset = 3.4;
  const gateCenter = new THREE.Vector3(
    room.pos.x + dirToCenter.x * gateOffset,
    0,
    room.pos.z + dirToCenter.z * gateOffset,
  );
  const pillarOffset = 1.9;
  const beamRotY = Math.atan2(perp.x, perp.z);

  return (
    <group>
      {[-1, 1].map((sign) => {
        const x = gateCenter.x + perp.x * pillarOffset * sign;
        const z = gateCenter.z + perp.z * pillarOffset * sign;
        return (
          <mesh key={sign} position={[x, 2.0, z]}>
            <cylinderGeometry args={[0.13, 0.13, 4.0, 16]} />
            <meshStandardMaterial
              color={room.color}
              emissive={room.color}
              emissiveIntensity={0.55}
              metalness={0.5}
              roughness={0.35}
              transparent
              opacity={0.88}
            />
          </mesh>
        );
      })}
      {/* 上の梁 */}
      <mesh
        position={[gateCenter.x, 4.0, gateCenter.z]}
        rotation-y={beamRotY}
      >
        <boxGeometry args={[pillarOffset * 2 + 0.26, 0.12, 0.18]} />
        <meshStandardMaterial
          color={room.color}
          emissive={room.color}
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

function RoomMarker({ room }: { room: Room }) {
  return (
    <group>
      {/* 入口ゲート（部屋とは別の位置に立てる、上の関数は world 座標で配置） */}
      <RoomGate room={room} />
      <group position={[room.pos.x, 0, room.pos.z]}>
        {/* 床のリング */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
          <ringGeometry args={[2.4, 3.2, 64]} />
          <meshBasicMaterial color={room.color} transparent opacity={0.45} />
        </mesh>
        {/* 内側のグロー */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0]}>
          <circleGeometry args={[2.4, 64]} />
          <meshBasicMaterial color={room.color} transparent opacity={0.06} />
        </mesh>
        {/* 部屋の囲い（後ろ側の半円柱状パーティション） */}
        {[-1, 1].map((sign) => {
          // 部屋の中心から見て、図書館の反対側の弧に沿って配置
          const dirFromCenter = new THREE.Vector3(
            room.pos.x,
            0,
            room.pos.z,
          ).normalize();
          const perpRoom = new THREE.Vector3(
            -dirFromCenter.z,
            0,
            dirFromCenter.x,
          );
          const px = dirFromCenter.x * 2.7 + perpRoom.x * 1.6 * sign;
          const pz = dirFromCenter.z * 2.7 + perpRoom.z * 1.6 * sign;
          return (
            <mesh key={sign} position={[px, 1.4, pz]}>
              <cylinderGeometry args={[0.1, 0.1, 2.8, 12]} />
              <meshStandardMaterial
                color={room.color}
                emissive={room.color}
                emissiveIntensity={0.35}
                transparent
                opacity={0.75}
              />
            </mesh>
          );
        })}
        {/* テーマプロップ（中央） */}
        <ThemeProp room={room} />
        {/* 名前ラベル */}
        <Text
          position={[0, 3.6, 0]}
          fontSize={0.55}
          color={room.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#0a0820"
        >
          {room.name}
        </Text>
        <Text
          position={[0, 3.05, 0]}
          fontSize={0.22}
          color="#c8c6e0"
          anchorX="center"
          anchorY="middle"
        >
          {room.topic}
        </Text>
      </group>
    </group>
  );
}

export default function RoomMarkers() {
  const clone = useAppStore((s) => s.clone);
  const activeRooms = useMemo(
    () => getActiveRooms(clone?.likes ?? []),
    [clone?.likes],
  );
  return (
    <>
      {activeRooms.map((room) => (
        <RoomMarker key={room.id} room={room} />
      ))}
    </>
  );
}
