'use client';

import { useEffect } from 'react';
import TopBar from './TopBar';
import ControlModeToggle from '@/components/main/ControlModeToggle';
import ControlPad from '@/components/main/ControlPad';
import TalkButton from '@/components/main/TalkButton';
import ConversationModule from '@/components/main/ConversationModule';
import { useAppStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { engine } from '@/lib/clone-engine';
import { todayKey } from '@/lib/util';
import VirtualWorld from '@/components/world/VirtualWorld';
import ChatPanel from '@/components/chat/ChatPanel';
import Overlays from '@/components/overlay/Overlays';
import EncounterOverlay from '@/components/encounter/EncounterOverlay';
import EncounterTrigger from '@/components/encounter/EncounterTrigger';

export default function AppShell() {
  const clone = useAppStore((s) => s.clone);
  const topics = useAppStore((s) => s.topics);
  const setTopics = useAppStore((s) => s.setTopics);
  const addTopic = useAppStore((s) => s.addTopic);

  useEffect(() => {
    if (!clone) return;
    const key = todayKey();
    if (topics.some((t) => t.dateKey === key)) return;
    let cancelled = false;
    (async () => {
      const exists = await storage.getTodaysTopic(key);
      if (exists) {
        if (!cancelled) addTopic(exists);
        return;
      }
      const history = await storage.getTopics();
      const topic = await engine.generateTodaysTopic(clone, history);
      await storage.saveTopic(topic);
      if (!cancelled) {
        setTopics([topic, ...history.filter((t) => t.id !== topic.id)]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clone, topics, setTopics, addTopic]);

  return (
    <div className="relative z-10 flex h-screen flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <VirtualWorld />
          </div>
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2">
              <ControlModeToggle />
            </div>
            <div className="absolute bottom-6 right-6">
              <ControlPad />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <TalkButton />
            </div>
            <div className="absolute bottom-6 left-1/2 flex w-full -translate-x-1/2 justify-center px-4">
              <ConversationModule />
            </div>
            <div className="absolute bottom-6 left-1/2 flex w-full -translate-x-1/2 justify-center px-4">
              <EncounterOverlay />
            </div>
            <div className="absolute bottom-6 left-6">
              <EncounterTrigger />
            </div>
          </div>
        </main>
        <ChatPanel />
      </div>
      <Overlays />
    </div>
  );
}
