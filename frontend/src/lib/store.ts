'use client';

import { create } from 'zustand';
import type {
  ChatTarget,
  Clone,
  ControlMode,
  Feedback,
  HumanFriend,
  ManualInput,
  Message,
  Topic,
  ViewTab,
  WorldAvatarState,
} from '@/types';

// 自分のフレンドID（クローン作成時に発行される想定。BE が発行する仕様にする予定）
function generateFriendId(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const pick = () =>
    Array.from({ length: 4 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  return `${pick()}-${pick()}`;
}

// デモ用の人間フレンド
const DEMO_HUMAN_FRIENDS: HumanFriend[] = [
  {
    id: 'human-1',
    friendId: 'YUKI-7F2K',
    name: 'ユウキ',
    bio: '韓ドラと深夜散歩が好き。沈黙の演出について語れる人。',
    addedAt: '2026-05-24',
  },
  {
    id: 'human-2',
    friendId: 'NOEL-3R9D',
    name: 'ノエル',
    bio: 'インテリアと光の温度に詳しい。日常の解像度を上げる話が好き。',
    addedAt: '2026-05-25',
  },
];

interface AppState {
  clone: Clone | null;
  topics: Topic[];
  messages: Message[];
  feedback: Record<string, Feedback>;
  viewTab: ViewTab;
  controlMode: ControlMode;
  worldAvatars: WorldAvatarState[];
  currentSpeaker: number;
  bootDone: boolean;
  hydrated: boolean;
  openOverlay: 'hobbies' | 'friends' | 'profile' | null;
  chatTrigger: { message: string; fixedReply: boolean } | null;
  myFriendId: string;
  humanFriends: HumanFriend[];
  chatTarget: ChatTarget;
  manualInput: ManualInput;
  nearestRoomId: string | null;
  roomConversationId: string | null;
  convTurnIdx: number;
  activeAgentRoomIds: string[]; // 場にいる部屋アバターの id（最大 3）
  roomResidents: Record<string, number>; // roomId -> 現在の roster index

  setClone: (clone: Clone | null) => void;
  setTopics: (topics: Topic[]) => void;
  addTopic: (topic: Topic) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  updateMessage: (id: string, text: string) => void;
  setFeedback: (feedback: Record<string, Feedback>) => void;
  pushFeedback: (feedback: Feedback) => void;
  setViewTab: (tab: ViewTab) => void;
  setControlMode: (mode: ControlMode) => void;
  setWorldAvatars: (a: WorldAvatarState[]) => void;
  setCurrentSpeaker: (i: number) => void;
  setBootDone: (v: boolean) => void;
  setHydrated: (v: boolean) => void;
  setOpenOverlay: (o: 'hobbies' | 'friends' | 'profile' | null) => void;
  setChatTrigger: (t: { message: string; fixedReply: boolean } | null) => void;
  addHumanFriend: (friendId: string) => { ok: boolean; message: string };
  setChatTarget: (target: ChatTarget) => void;
  setManualInput: (input: ManualInput) => void;
  setNearestRoomId: (id: string | null) => void;
  setRoomConversationId: (id: string | null) => void;
  setConvTurnIdx: (n: number | ((prev: number) => number)) => void;
  setAgentRotation: (ids: string[], residents: Record<string, number>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  clone: null,
  topics: [],
  messages: [],
  feedback: {},
  viewTab: 'world',
  controlMode: 'auto',
  worldAvatars: [],
  currentSpeaker: 0,
  bootDone: false,
  hydrated: false,
  openOverlay: null,
  chatTrigger: null,
  myFriendId: generateFriendId(),
  humanFriends: DEMO_HUMAN_FRIENDS,
  chatTarget: { type: 'self' },
  manualInput: { x: 0, z: 0 },
  nearestRoomId: null,
  roomConversationId: null,
  convTurnIdx: 0,
  activeAgentRoomIds: [],
  roomResidents: {},

  setClone: (clone) => set({ clone }),
  setTopics: (topics) => set({ topics }),
  addTopic: (topic) =>
    set((s) => ({ topics: [topic, ...s.topics.filter((t) => t.id !== topic.id)] })),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  updateMessage: (id, text) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, text } : m)),
    })),
  setFeedback: (feedback) => set({ feedback }),
  pushFeedback: (feedback) =>
    set((s) => ({ feedback: { ...s.feedback, [feedback.topicId]: feedback } })),
  setViewTab: (viewTab) => set({ viewTab }),
  setControlMode: (controlMode) => set({ controlMode }),
  setWorldAvatars: (worldAvatars) => set({ worldAvatars }),
  setCurrentSpeaker: (currentSpeaker) => set({ currentSpeaker }),
  setBootDone: (bootDone) => set({ bootDone }),
  setHydrated: (hydrated) => set({ hydrated }),
  setOpenOverlay: (openOverlay) => set({ openOverlay }),
  setChatTrigger: (chatTrigger) => set({ chatTrigger }),
  addHumanFriend: (friendId) => {
    const cleaned = friendId.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned)) {
      return { ok: false, message: 'ID 形式が違います（例: ABCD-1234）' };
    }
    let result = { ok: true, message: '' };
    set((s) => {
      if (cleaned === s.myFriendId) {
        result = { ok: false, message: '自分の ID は追加できません' };
        return s;
      }
      if (s.humanFriends.some((f) => f.friendId === cleaned)) {
        result = { ok: false, message: 'すでに追加済みのフレンドです' };
        return s;
      }
      // デモ：ID から仮の名前を作成（BE 接続後はサーバから取得）
      const demoName = `User-${cleaned.split('-')[0]}`;
      const newFriend: HumanFriend = {
        id: `human-${Date.now()}`,
        friendId: cleaned,
        name: demoName,
        bio: '（BE 接続後にプロフィールが取得されます）',
        addedAt: new Date().toISOString().slice(0, 10),
      };
      result = { ok: true, message: `${demoName} を追加しました` };
      return { humanFriends: [...s.humanFriends, newFriend] };
    });
    return result;
  },
  setChatTarget: (chatTarget) => set({ chatTarget }),
  setManualInput: (manualInput) => set({ manualInput }),
  setNearestRoomId: (nearestRoomId) => set({ nearestRoomId }),
  setRoomConversationId: (roomConversationId) => set({ roomConversationId }),
  setConvTurnIdx: (n) =>
    set((s) => ({
      convTurnIdx: typeof n === 'function' ? n(s.convTurnIdx) : n,
    })),
  setAgentRotation: (activeAgentRoomIds, roomResidents) =>
    set({ activeAgentRoomIds, roomResidents }),
}));
