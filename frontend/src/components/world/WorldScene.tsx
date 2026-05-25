'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore } from '@/lib/store';
import Avatar from './Avatar';
import Library from './Library';
import Particles from './Particles';
import RoomMarkers from './RoomMarkers';
import {
  CONVERSATION,
  PALETTES,
  ROOM_RADIUS,
  ROOM_TEMPLATES,
  WAYPOINTS,
  getActiveRooms,
} from './palettes';
import type { AvatarPalette } from './palettes';
import type { WorldAvatarState } from '@/types';

const STAY_DURATION = 8; // seconds at each waypoint
const TRAVEL_DURATION = 4; // seconds traveling
const MANUAL_SPEED = 2.2; // units per second
const TURN_SPEED = 2.6; // radians per second
const WORLD_BOUND = 14; // 各部屋（最遠 ±12）まで歩ける
// 集会場の中心。ここに Sage/Echo がいる。ミラがここに近づくと会話開始
const MEETING_CENTER = new THREE.Vector3(0, 0, 5.0);
const CONVERSATION_RADIUS = 3.2;
const ROOM_LINE_INTERVAL_MS = 5200; // 部屋アバターのセリフ送り間隔
const AGENT_ROTATION_MS = 60000; // アバター入れ替わり間隔
const WANDER_RADIUS_MEETING = 0.7; // Sage/Echo の揺らぎ半径
const NUM_FREE_AGENTS = 5; // 世界を自由に歩き回る AI エージェントの数
const NPC_SPEED_MIN = 1.1; // m/s
const NPC_SPEED_MAX = 1.9;
const FREE_STEP_MIN = 4; // 次の目的地までの距離（最小）
const FREE_STEP_MAX = 10; // 次の目的地までの距離（最大）
const RESIDENT_WANDER_RADIUS = 2.6; // 部屋住人が歩き回る半径
const NPC_IDLE_MIN_S = 1.8; // 目的地到達後の待機時間
const NPC_IDLE_MAX_S = 4;
const AUTO_CYCLE = STAY_DURATION + TRAVEL_DURATION;

/** 自動巡回パス上で pos に最も近い地点のウェイポイント index と経過時間 */
function nearestWaypointOnPath(pos: THREE.Vector3): {
  index: number;
  elapsed: number;
} {
  let bestIndex = 0;
  let bestElapsed = 0;
  let bestDistSq = Infinity;

  for (let i = 0; i < WAYPOINTS.length; i++) {
    const from = WAYPOINTS[i].pos;
    const to = WAYPOINTS[(i + 1) % WAYPOINTS.length].pos;
    const cycleBase = i * AUTO_CYCLE;

    const stayD = pos.distanceToSquared(from);
    if (stayD < bestDistSq) {
      bestDistSq = stayD;
      bestIndex = i;
      bestElapsed = cycleBase;
    }

    const seg = to.clone().sub(from);
    const lenSq = seg.lengthSq();
    if (lenSq > 1e-6) {
      const tProj = Math.max(
        0,
        Math.min(1, pos.clone().sub(from).dot(seg) / lenSq),
      );
      const onSeg = from.clone().lerp(to, tProj);
      const d = pos.distanceToSquared(onSeg);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestIndex = i;
        bestElapsed = cycleBase + STAY_DURATION + tProj * TRAVEL_DURATION;
      }
    }
  }

  return { index: bestIndex, elapsed: bestElapsed };
}

interface AutoPathTransition {
  from: THREE.Vector3;
  to: THREE.Vector3;
  startT: number;
  afterIndex: number;
}

export default function WorldScene() {
  const setWorldAvatars = useAppStore((s) => s.setWorldAvatars);
  const setCurrentSpeaker = useAppStore((s) => s.setCurrentSpeaker);
  const currentSpeaker = useAppStore((s) => s.currentSpeaker);
  const controlMode = useAppStore((s) => s.controlMode);
  const thirdCameraDistance = useAppStore((s) => s.thirdCameraDistance);
  const manualInput = useAppStore((s) => s.manualInput);
  const chatTarget = useAppStore((s) => s.chatTarget);
  const clone = useAppStore((s) => s.clone);
  const playerName = clone?.name ?? 'Mira';
  const encounter = useAppStore((s) => s.encounter);
  // クローンの likes にマッチした部屋だけ表示。同じ likes に対しては同一参照
  const activeRooms = useMemo(
    () => getActiveRooms(clone?.likes ?? []),
    [clone?.likes],
  );

  const startTime = useRef<number | null>(null);
  const [miraPos, setMiraPos] = useState(WAYPOINTS[0].pos.clone());
  const [miraRot, setMiraRot] = useState(0);
  const [miraActivity, setMiraActivity] = useState(WAYPOINTS[0].activity);

  const sagePos = useMemo(() => new THREE.Vector3(2.3, 0, 5.0), []);
  const echoPos = useMemo(() => new THREE.Vector3(-2.3, 0, 5.0), []);
  const [sageRot, setSageRot] = useState(0);
  const [echoRot, setEchoRot] = useState(0);

  // カメラ：OrbitControls をユーザー操作の主にする。target は Mira を追従し、
  // カメラ自身も同じデルタで移動 → 「相対視点を保ったまま追従」
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const initialized = useRef(false);
  const prevControlModeRef = useRef(controlMode);
  const autoTransition = useRef<AutoPathTransition | null>(null);
  const cameraOffset = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());
  const cameraLookAt = useRef(new THREE.Vector3());

  // 部屋アバターの状態：各部屋の現在のセリフ index、向き、プレイヤーが近くにいるか
  const [roomLineIdx, setRoomLineIdx] = useState<number[]>(() => activeRooms.map(() => 0));
  const [roomRots, setRoomRots] = useState<number[]>(() =>
    activeRooms.map((r) => Math.atan2(-r.pos.x, -r.pos.z)),
  );
  const [roomNear, setRoomNear] = useState<boolean[]>(() => activeRooms.map(() => false));
  const setNearestRoomId = useAppStore((s) => s.setNearestRoomId);
  const nearestRoomIdRef = useRef<string | null>(null);

  // 部屋アバターとの会話進行（ConversationModule が管理）
  const roomConversationId = useAppStore((s) => s.roomConversationId);

  // 場にいる部屋アバターのローテーション（最大 3、60 秒ごとに入れ替わり）
  const activeAgentRoomIds = useAppStore((s) => s.activeAgentRoomIds);
  const roomResidents = useAppStore((s) => s.roomResidents);
  const setAgentRotation = useAppStore((s) => s.setAgentRotation);

  // アイドル揺らぎ用の Vector3 ref（一度作って毎フレーム書き換える）
  const sageAnimatedPos = useRef(new THREE.Vector3());
  const echoAnimatedPos = useRef(new THREE.Vector3());
  // エンカウント中のアバターのライブ位置（集会場から接近 → 終了後に帰還）
  const encounterLivePos = useRef(new THREE.Vector3(2.3, 0, 5.0));
  const encounterAvatarNameRef = useRef<'Sage' | 'Echo' | null>(null);
  // 部屋住人の現在位置（部屋中心の周辺を歩き回る）
  const residentLive = useRef<
    {
      pos: THREE.Vector3;
      target: THREE.Vector3;
      speed: number;
      nextDecideAt: number;
    }[]
  >([]);
  const [residentRots, setResidentRots] = useState<number[]>([]);

  // activeRooms 構成変更時、住人の live data を再生成
  useEffect(() => {
    residentLive.current = activeRooms.map((r) => ({
      pos: r.pos.clone(),
      target: r.pos.clone(),
      speed: NPC_SPEED_MIN + Math.random() * (NPC_SPEED_MAX - NPC_SPEED_MIN) * 0.6,
      nextDecideAt: 0,
    }));
    setResidentRots(activeRooms.map(() => Math.atan2(-1, -1)));
  }, [activeRooms]);

  // フリーエージェント（世界を自由に歩き回る AI エージェント）
  interface FreeAgentSlot {
    id: string;
    name: string;
    palette: AvatarPalette;
  }
  const [freeAgents, setFreeAgents] = useState<FreeAgentSlot[]>([]);
  const [freeRots, setFreeRots] = useState<number[]>([]);
  const freeLive = useRef<
    {
      pos: THREE.Vector3;
      target: THREE.Vector3;
      speed: number;
      nextDecideAt: number;
    }[]
  >([]);

  // ヘルパー: 全 roster から候補プールを作る
  const buildAgentPool = useCallback((): FreeAgentSlot[] => {
    const pool: { name: string; palette: AvatarPalette }[] = [];
    ROOM_TEMPLATES.forEach((t) => {
      t.roster.forEach((name) =>
        pool.push({ name, palette: t.avatarPalette }),
      );
    });
    return [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, NUM_FREE_AGENTS)
      .map((s, i) => ({
        id: `free-${i}-${s.name}`,
        name: s.name,
        palette: s.palette,
      }));
  }, []);

  // 初回 & live data 初期化
  useEffect(() => {
    const slots = buildAgentPool();
    setFreeAgents(slots);
    freeLive.current = slots.map(() => {
      const angle = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 9;
      const pos = new THREE.Vector3(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r,
      );
      return {
        pos,
        target: pos.clone(),
        speed: NPC_SPEED_MIN + Math.random() * (NPC_SPEED_MAX - NPC_SPEED_MIN),
        nextDecideAt: 0,
      };
    });
    setFreeRots(slots.map(() => 0));
  }, [buildAgentPool]);

  // フリーエージェントの identity を 60s ごとにシャッフル
  useEffect(() => {
    if (roomConversationId) return;
    const id = setInterval(() => {
      const slots = buildAgentPool();
      setFreeAgents(slots);
      // live data は維持（位置はそのまま、名前だけ入れ替わる感）
    }, AGENT_ROTATION_MS);
    return () => clearInterval(id);
  }, [buildAgentPool, roomConversationId]);

  // 部屋数が変わったら state をリセット（onboarding 後など）
  useEffect(() => {
    setRoomLineIdx(activeRooms.map(() => 0));
    setRoomRots(activeRooms.map((r) => Math.atan2(-r.pos.x, -r.pos.z)));
    setRoomNear(activeRooms.map(() => false));
  }, [activeRooms]);

  // 部屋住人ローテーション: 全部屋に常に 1 人いる。60s ごとに roster index をシャッフル
  const rotateAgents = useCallback(() => {
    if (activeRooms.length === 0) {
      setAgentRotation([], {});
      return;
    }
    const ids = activeRooms.map((r) => r.id);
    const residents: Record<string, number> = {};
    activeRooms.forEach((r) => {
      residents[r.id] = Math.floor(Math.random() * Math.max(1, r.roster.length));
    });
    setAgentRotation(ids, residents);
  }, [activeRooms, setAgentRotation]);

  // 初回 & 部屋構成が変わったとき
  useEffect(() => {
    rotateAgents();
  }, [rotateAgents]);

  // 60 秒ごとに入れ替わり（会話中は一時停止）
  useEffect(() => {
    if (roomConversationId) return;
    const id = setInterval(rotateAgents, AGENT_ROTATION_MS);
    return () => clearInterval(id);
  }, [rotateAgents, roomConversationId]);

  // エンカウント開始時にアバターのライブ位置を初期化
  useEffect(() => {
    if (!encounter) return;
    encounterAvatarNameRef.current = encounter.avatarName as 'Sage' | 'Echo';
    encounterLivePos.current.copy(
      encounter.avatarName === 'Sage' ? sagePos : echoPos,
    );
  }, [encounter?.sessionId, sagePos, echoPos]);

  // conversation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpeaker((currentSpeaker + 1) % CONVERSATION.length);
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpeaker]);

  // 各部屋のセリフを独立に巡回（少しずつズラして同時に切り替わらないように）
  useEffect(() => {
    const intervals = activeRooms.map((room, i) =>
      setInterval(() => {
        setRoomLineIdx((prev) =>
          prev.map((v, idx) => (idx === i ? (v + 1) % room.lines.length : v)),
        );
      }, ROOM_LINE_INTERVAL_MS + i * 700),
    );
    return () => intervals.forEach(clearInterval);
  }, [activeRooms]);


  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // 会話相手の位置を取得（Sage/Echo または部屋アバター）
    let agentPos: THREE.Vector3 | null = null;
    if (chatTarget.type === 'agent') {
      if (chatTarget.id === 'sage') agentPos = sagePos;
      else if (chatTarget.id === 'echo') agentPos = echoPos;
      else {
        const room = activeRooms.find((r) => r.id === chatTarget.id);
        if (room) agentPos = room.pos;
      }
    }
    const chattingWithAgent = chatTarget.type === 'agent' && agentPos !== null;

    // 部屋会話中（3D 吹き出し対話）: Mira はその場で停止し相手を向く
    const conversingRoom = roomConversationId
      ? activeRooms.find((r) => r.id === roomConversationId)
      : null;
    const conversingRoomPos = conversingRoom ? conversingRoom.pos : null;

    let nextPos: THREE.Vector3;
    let desiredRot: number;
    let activity: string;

    const canAutoPatrol =
      !conversingRoomPos &&
      !(chattingWithAgent && agentPos) &&
      !encounter;

    if (prevControlModeRef.current !== controlMode) {
      if (
        controlMode === 'auto' &&
        prevControlModeRef.current === 'manual' &&
        canAutoPatrol
      ) {
        const { index, elapsed } = nearestWaypointOnPath(miraPos);
        const nextIdx = (index + 1) % WAYPOINTS.length;
        const dest = WAYPOINTS[nextIdx].pos;
        if (miraPos.distanceTo(dest) < 0.35) {
          startTime.current = t - elapsed;
          autoTransition.current = null;
        } else {
          autoTransition.current = {
            from: miraPos.clone(),
            to: dest.clone(),
            startT: t,
            afterIndex: nextIdx,
          };
          startTime.current = null;
        }
      }
      if (controlMode === 'manual') {
        autoTransition.current = null;
        startTime.current = null;
      }
      prevControlModeRef.current = controlMode;
    }

    if (conversingRoomPos && conversingRoom) {
      // 部屋アバターと 3D 会話中: その場で停止し、相手を向く
      startTime.current = null;
      nextPos = miraPos;
      desiredRot = Math.atan2(
        conversingRoomPos.x - miraPos.x,
        conversingRoomPos.z - miraPos.z,
      );
      activity = `会話中 · ${conversingRoom.avatarName}`;
      if (miraActivity !== activity) setMiraActivity(activity);
    } else if (chattingWithAgent && agentPos) {
      // AI エージェントと会話中（ChatPanel 経由）: Mira はその場で停止し、相手のほうを向く
      startTime.current = null;
      nextPos = miraPos;
      desiredRot = Math.atan2(agentPos.x - miraPos.x, agentPos.z - miraPos.z);
      activity = `会話中 · ${chatTarget.name}`;
      if (miraActivity !== activity) setMiraActivity(activity);
    } else if (controlMode === 'manual') {
      // 手動モード（タンク式）:
      //   W/↑ (z=-1) = アバターの正面方向に前進
      //   S/↓ (z=+1) = 後退（向きは変えずに後ろに移動）
      //   A/← (x=-1) = その場で左旋回
      //   D/→ (x=+1) = その場で右旋回
      //   斜め入力 = 旋回しながら移動
      startTime.current = null;
      if (manualInput.x !== 0 || manualInput.z !== 0) {
        let newRot = miraRot;
        if (manualInput.x !== 0) {
          const rotSign = manualInput.z > 0 ? 1 : -1;
          newRot = miraRot + rotSign * manualInput.x * TURN_SPEED * delta;
        }

        let newX = miraPos.x;
        let newZ = miraPos.z;
        if (manualInput.z !== 0) {
          const facingX = Math.sin(newRot);
          const facingZ = Math.cos(newRot);
          const dx = facingX * -manualInput.z * MANUAL_SPEED * delta;
          const dz = facingZ * -manualInput.z * MANUAL_SPEED * delta;
          newX = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, miraPos.x + dx));
          newZ = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, miraPos.z + dz));
        }
        nextPos = new THREE.Vector3(newX, miraPos.y, newZ);
        setMiraPos(nextPos);
        setMiraRot(newRot);
        desiredRot = newRot;
        activity =
          manualInput.z !== 0
            ? manualInput.x !== 0
              ? '手動移動中（旋回）'
              : '手動移動中'
            : '旋回中';
      } else {
        nextPos = miraPos;
        desiredRot = miraRot;
        activity = '待機中（手動モード）';
      }
      if (miraActivity !== activity) setMiraActivity(activity);
    } else if (encounter) {
      // エンカウント中: 自動モードでMiraを停止させ、相手を向かせる
      startTime.current = null;
      nextPos = miraPos;
      desiredRot = Math.atan2(
        encounterLivePos.current.x - miraPos.x,
        encounterLivePos.current.z - miraPos.z,
      );
      activity = `会話中 · ${encounter.avatarName}`;
      if (miraActivity !== activity) setMiraActivity(activity);
    } else if (autoTransition.current) {
      const tr = autoTransition.current;
      const k = Math.min(1, (t - tr.startT) / TRAVEL_DURATION);
      nextPos = tr.from.clone().lerp(tr.to, k);
      const dir = tr.to.clone().sub(tr.from);
      desiredRot = dir.lengthSq() > 1e-6 ? Math.atan2(dir.x, dir.z) : miraRot;
      activity = `移動中 · ${WAYPOINTS[tr.afterIndex].name}`;
      setMiraPos(nextPos);
      setMiraRot(desiredRot);
      if (miraActivity !== activity) setMiraActivity(activity);
      if (k >= 1) {
        const { elapsed } = nearestWaypointOnPath(tr.to);
        startTime.current = t - elapsed;
        autoTransition.current = null;
      }
    } else {
      if (startTime.current === null) startTime.current = t;
      const elapsed = t - startTime.current;
      const cycle = AUTO_CYCLE;
      const total = WAYPOINTS.length * cycle;
      const pos = elapsed % total;
      const wpIndex = Math.floor(pos / cycle);
      const localTime = pos % cycle;
      const fromWp = WAYPOINTS[wpIndex];
      const toWp = WAYPOINTS[(wpIndex + 1) % WAYPOINTS.length];

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
      desiredRot =
        localTime < STAY_DURATION
          ? Math.atan2(
              -fromWp.pos.x || 0.001,
              -fromWp.pos.z || 0.001,
            )
          : Math.atan2(dir.x, dir.z);
      setMiraRot(desiredRot);
      setMiraActivity(activity);
    }

    // 会話判定: ミラが集会場に近く、エージェントチャット中でなければ会話開始
    const distToMeeting = nextPos.distanceTo(MEETING_CENTER);
    const inGroupConversation =
      !chattingWithAgent && distToMeeting < CONVERSATION_RADIUS;

    let sagerot: number;
    let echorot: number;
    if (chattingWithAgent) {
      // ユーザーが特定エージェントと会話中: 相手はミラを向き、もう片方は通常通り
      const sageTowardMira = Math.atan2(nextPos.x - sagePos.x, nextPos.z - sagePos.z);
      const echoTowardMira = Math.atan2(nextPos.x - echoPos.x, nextPos.z - echoPos.z);
      sagerot = chatTarget.type === 'agent' && chatTarget.id === 'sage' ? sageTowardMira : sageRot;
      echorot = chatTarget.type === 'agent' && chatTarget.id === 'echo' ? echoTowardMira : echoRot;
    } else if (inGroupConversation) {
      // 3 人で会話成立: 話者は他 2 人の中央を向く、聞き手は話者を向く
      const positions: Record<'mira' | 'sage' | 'echo', THREE.Vector3> = {
        mira: nextPos,
        sage: sagePos,
        echo: echoPos,
      };
      const speakerKey = CONVERSATION[currentSpeaker].speaker as 'mira' | 'sage' | 'echo';
      const speakerPos = positions[speakerKey];

      const faceCenterOfOthers = (selfKey: 'mira' | 'sage' | 'echo', selfPos: THREE.Vector3) => {
        const otherKeys = (['mira', 'sage', 'echo'] as const).filter((k) => k !== selfKey);
        const ctr = new THREE.Vector3();
        otherKeys.forEach((k) => ctr.add(positions[k]));
        ctr.multiplyScalar(1 / otherKeys.length);
        return Math.atan2(ctr.x - selfPos.x, ctr.z - selfPos.z);
      };
      const faceSpeaker = (selfPos: THREE.Vector3) =>
        Math.atan2(speakerPos.x - selfPos.x, speakerPos.z - selfPos.z);

      sagerot =
        speakerKey === 'sage' ? faceCenterOfOthers('sage', sagePos) : faceSpeaker(sagePos);
      echorot =
        speakerKey === 'echo' ? faceCenterOfOthers('echo', echoPos) : faceSpeaker(echoPos);

      // 自動モード時のみミラの向きも会話に参加するように更新
      if (controlMode !== 'manual') {
        const miraConversationRot =
          speakerKey === 'mira'
            ? faceCenterOfOthers('mira', nextPos)
            : faceSpeaker(nextPos);
        desiredRot = miraConversationRot;
        setMiraRot(miraConversationRot);
      }
    } else if (encounter && encounterAvatarNameRef.current) {
      // エンカウント中: 相手アバターはMiraを向く、もう一方はデフォルト
      if (encounter.avatarName === 'Sage') {
        sagerot = Math.atan2(
          nextPos.x - encounterLivePos.current.x,
          nextPos.z - encounterLivePos.current.z,
        );
        echorot = Math.atan2(sagePos.x - echoPos.x, sagePos.z - echoPos.z);
      } else {
        echorot = Math.atan2(
          nextPos.x - encounterLivePos.current.x,
          nextPos.z - encounterLivePos.current.z,
        );
        sagerot = Math.atan2(echoPos.x - sagePos.x, echoPos.z - sagePos.z);
      }
    } else {
      // 会話なし: Sage と Echo はお互いを見て待っている（デフォルトの待機ポーズ）
      sagerot = Math.atan2(echoPos.x - sagePos.x, echoPos.z - sagePos.z);
      echorot = Math.atan2(sagePos.x - echoPos.x, sagePos.z - echoPos.z);
    }
    setSageRot(sagerot);
    setEchoRot(echorot);

    // 部屋アバターの近接判定と向き更新
    if (activeRooms.length > 0 && roomNear.length === activeRooms.length) {
      let roomChanged = false;
      const nextNear = activeRooms.map((r) => nextPos.distanceTo(r.pos) < ROOM_RADIUS);
      const nextRots = activeRooms.map((r, i) => {
        const isChattingMe = chatTarget.type === 'agent' && chatTarget.id === r.id;
        const isInConvMe = roomConversationId === r.id;
        if (nextNear[i] || isChattingMe || isInConvMe) {
          return Math.atan2(nextPos.x - r.pos.x, nextPos.z - r.pos.z);
        }
        return Math.atan2(-r.pos.x, -r.pos.z);
      });
      for (let i = 0; i < activeRooms.length; i++) {
        if (nextNear[i] !== roomNear[i]) roomChanged = true;
        if (Math.abs(nextRots[i] - roomRots[i]) > 0.04) roomChanged = true;
      }
      if (roomChanged) {
        setRoomNear(nextNear);
        setRoomRots(nextRots);
      }
    }

    // 最寄り部屋（半径内で一番近い & そこに住人がいる場合だけ）を store に反映
    let minDist = Infinity;
    let nearestId: string | null = null;
    for (let i = 0; i < activeRooms.length; i++) {
      const room = activeRooms[i];
      const isPresent =
        activeAgentRoomIds.includes(room.id) || roomConversationId === room.id;
      if (!isPresent) continue;
      const d = nextPos.distanceTo(room.pos);
      if (d < ROOM_RADIUS && d < minDist) {
        minDist = d;
        nearestId = room.id;
      }
    }
    if (nearestRoomIdRef.current !== nearestId) {
      nearestRoomIdRef.current = nearestId;
      setNearestRoomId(nearestId);
    }

    // アイドル揺らぎ: エンカウント中のアバターは揺らぎをスキップ
    if (encounterAvatarNameRef.current !== 'Sage') {
      sageAnimatedPos.current.set(
        sagePos.x + Math.sin(t * 0.42) * WANDER_RADIUS_MEETING,
        0,
        sagePos.z + Math.cos(t * 0.33 + 0.6) * WANDER_RADIUS_MEETING * 0.6,
      );
    }
    if (encounterAvatarNameRef.current !== 'Echo') {
      echoAnimatedPos.current.set(
        echoPos.x + Math.sin(t * 0.38 + 1.5) * WANDER_RADIUS_MEETING,
        0,
        echoPos.z + Math.cos(t * 0.46 + 1.5) * WANDER_RADIUS_MEETING * 0.6,
      );
    }

    // エンカウントアバターの接近 / 帰還アニメーション
    const ENCOUNTER_STOP_DIST = 1.8;
    if (encounter && encounterAvatarNameRef.current) {
      const toMira = nextPos.clone().sub(encounterLivePos.current);
      const dist = toMira.length();
      if (dist > ENCOUNTER_STOP_DIST + 0.05) {
        const target = nextPos.clone().sub(
          toMira.normalize().multiplyScalar(ENCOUNTER_STOP_DIST),
        );
        encounterLivePos.current.lerp(target, Math.min(1, delta * 1.5));
      }
    } else if (!encounter && encounterAvatarNameRef.current) {
      const base = encounterAvatarNameRef.current === 'Sage' ? sagePos : echoPos;
      encounterLivePos.current.lerp(base, Math.min(1, delta * 0.8));
      if (encounterLivePos.current.distanceTo(base) < 0.15) {
        encounterLivePos.current.copy(base);
        encounterAvatarNameRef.current = null;
      }
    }
    // 部屋住人: 部屋中心の周辺をミラと同じ方式で歩き回る
    const newResRots = residentRots.slice();
    let resRotsChanged = false;
    for (let i = 0; i < activeRooms.length; i++) {
      const live = residentLive.current[i];
      if (!live) continue;
      const room = activeRooms[i];
      // チャット中の相手は中心で静止して向き合う
      if (roomConversationId === room.id) {
        live.pos.lerp(room.pos, 0.1);
        continue;
      }
      const dx = live.target.x - live.pos.x;
      const dz = live.target.z - live.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.3 && t > live.nextDecideAt) {
        // 次の目的地を部屋中心の周辺で選ぶ
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * RESIDENT_WANDER_RADIUS;
        live.target.set(
          room.pos.x + Math.cos(angle) * r,
          0,
          room.pos.z + Math.sin(angle) * r,
        );
        const idle = NPC_IDLE_MIN_S + Math.random() * (NPC_IDLE_MAX_S - NPC_IDLE_MIN_S);
        live.nextDecideAt = t + idle;
        const ndx = live.target.x - live.pos.x;
        const ndz = live.target.z - live.pos.z;
        if (Math.hypot(ndx, ndz) > 0.05) {
          const nr = Math.atan2(ndx, ndz);
          if (Math.abs((newResRots[i] ?? 0) - nr) > 0.05) {
            newResRots[i] = nr;
            resRotsChanged = true;
          }
        }
      } else if (dist > 0.05) {
        const step = live.speed * delta;
        if (step >= dist) {
          live.pos.x = live.target.x;
          live.pos.z = live.target.z;
        } else {
          live.pos.x += (dx / dist) * step;
          live.pos.z += (dz / dist) * step;
        }
      }
    }
    if (resRotsChanged) setResidentRots(newResRots);

    // フリーエージェント: 世界を自由に歩き回る（ミラと同じ waypoint 移動方式）
    const newFreeRots = freeRots.slice();
    let freeRotsChanged = false;
    for (let i = 0; i < freeLive.current.length; i++) {
      const live = freeLive.current[i];
      if (!live) continue;
      const dx = live.target.x - live.pos.x;
      const dz = live.target.z - live.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.3 && t > live.nextDecideAt) {
        // 次の目的地をワールド内のランダムな点に
        const angle = Math.random() * Math.PI * 2;
        const r = FREE_STEP_MIN + Math.random() * (FREE_STEP_MAX - FREE_STEP_MIN);
        const nx = live.pos.x + Math.cos(angle) * r;
        const nz = live.pos.z + Math.sin(angle) * r;
        live.target.set(
          Math.max(-WORLD_BOUND + 1, Math.min(WORLD_BOUND - 1, nx)),
          0,
          Math.max(-WORLD_BOUND + 1, Math.min(WORLD_BOUND - 1, nz)),
        );
        const idle = NPC_IDLE_MIN_S + Math.random() * (NPC_IDLE_MAX_S - NPC_IDLE_MIN_S);
        live.nextDecideAt = t + idle;
        const ndx = live.target.x - live.pos.x;
        const ndz = live.target.z - live.pos.z;
        if (Math.hypot(ndx, ndz) > 0.05) {
          const nr = Math.atan2(ndx, ndz);
          if (Math.abs((newFreeRots[i] ?? 0) - nr) > 0.05) {
            newFreeRots[i] = nr;
            freeRotsChanged = true;
          }
        }
      } else if (dist > 0.05) {
        const step = live.speed * delta;
        if (step >= dist) {
          live.pos.x = live.target.x;
          live.pos.z = live.target.z;
        } else {
          live.pos.x += (dx / dist) * step;
          live.pos.z += (dz / dist) * step;
        }
      }
    }
    if (freeRotsChanged) setFreeRots(newFreeRots);

    // カメラ追従: OrbitControls の target を Mira に lerp、カメラも同じデルタ移動
    if (controlsRef.current) {
      const facingX = Math.sin(desiredRot);
      const facingZ = Math.cos(desiredRot);
      cameraTarget.current.set(nextPos.x, nextPos.y, nextPos.z);

      const dist = thirdCameraDistance;
      const height = 2.45 * (dist / 4.1);
      cameraOffset.current.set(-facingX * dist, height, -facingZ * dist);
      cameraLookAt.current.set(
        nextPos.x + facingX * 1.6,
        nextPos.y + 1.1,
        nextPos.z + facingZ * 1.6,
      );

      const desiredCameraPos = cameraTarget.current.clone().add(cameraOffset.current);
      if (!initialized.current) {
        camera.position.copy(desiredCameraPos);
        controlsRef.current.target.copy(cameraLookAt.current);
        initialized.current = true;
      } else {
        camera.position.lerp(desiredCameraPos, 0.14);
        controlsRef.current.target.lerp(cameraLookAt.current, 0.18);
      }
      camera.lookAt(controlsRef.current.target);
    }

    // publish to store
    const avatars: WorldAvatarState[] = [
      {
        id: 'mira',
        name: playerName,
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

  // ミラが集会場に近い時だけ会話開始（吹き出し表示）。部屋会話中は集会場会話を抑制
  const inGroupConversationView =
    chatTarget.type !== 'agent' &&
    !roomConversationId &&
    miraPos.distanceTo(MEETING_CENTER) < CONVERSATION_RADIUS;
  const speakerIdx = inGroupConversationView
    ? ['mira', 'sage', 'echo'].indexOf(CONVERSATION[currentSpeaker].speaker)
    : -1;
  const speech = inGroupConversationView
    ? CONVERSATION[currentSpeaker].line
    : undefined;

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={false}
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
      />
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
      <RoomMarkers />
      <Particles />

      <Avatar
        name={playerName}
        palette={PALETTES.mira}
        position={miraPos}
        rotationY={miraRot}
        activity={miraActivity}
        speaking={!roomConversationId && speakerIdx === 0}
        speech={!roomConversationId && speakerIdx === 0 ? speech : undefined}
      />
      <Avatar
        name="Sage"
        palette={PALETTES.sage}
        position={encounterAvatarNameRef.current === 'Sage' ? encounterLivePos.current : sageAnimatedPos.current}
        rotationY={sageRot}
        activity="対話"
        speaking={speakerIdx === 1}
        speech={speakerIdx === 1 ? speech : undefined}
      />
      <Avatar
        name="Echo"
        palette={PALETTES.echo}
        position={encounterAvatarNameRef.current === 'Echo' ? encounterLivePos.current : echoAnimatedPos.current}
        rotationY={echoRot}
        activity="対話"
        speaking={speakerIdx === 2}
        speech={speakerIdx === 2 ? speech : undefined}
      />

      {/* テーマ部屋のアバター（住人は常に 1 人、roster で名前ローテーション、部屋周辺を歩き回る） */}
      {activeRooms.map((room, i) => {
        const residentIdx = roomResidents[room.id] ?? 0;
        const residentName = room.roster[residentIdx] ?? room.avatarName;
        const showStandalone = !roomConversationId && (roomNear[i] ?? false);
        const livePos = residentLive.current[i]?.pos ?? room.pos;
        const liveRot = residentRots[i] ?? roomRots[i] ?? 0;
        return (
          <Avatar
            key={room.id}
            name={residentName}
            palette={room.avatarPalette}
            position={livePos}
            rotationY={roomConversationId === room.id ? roomRots[i] ?? 0 : liveRot}
            activity={room.topic}
            speaking={showStandalone}
            speech={showStandalone ? room.lines[roomLineIdx[i] ?? 0] : undefined}
          />
        );
      })}

      {/* フリーエージェント: 世界をランダムに歩き回る AI エージェント（Mira と同じ移動方式） */}
      {freeAgents.map((agent, i) => {
        const live = freeLive.current[i];
        if (!live) return null;
        return (
          <Avatar
            key={agent.id}
            name={agent.name}
            palette={agent.palette}
            position={live.pos}
            rotationY={freeRots[i] ?? 0}
            activity="散策中"
          />
        );
      })}
    </>
  );
}
