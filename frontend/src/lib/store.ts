'use client';

import { create } from 'zustand';
import type {
  Clone,
  ControlMode,
  Feedback,
  Message,
  Topic,
  ViewTab,
  WorldAvatarState,
} from '@/types';

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
}));
