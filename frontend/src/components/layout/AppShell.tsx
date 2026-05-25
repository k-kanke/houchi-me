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
  const setActivities = useAppStore((s) => s.setActivities);
  const setLatestActivity = useAppStore((s) => s.setLatestActivity);

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
      const [activities, latestActivity] = await Promise.all([
        storage.getTodayActivities(),
        storage.getLatestActivity(),
      ]);
      if (!cancelled) {
        setTopics([topic, ...history.filter((t) => t.id !== topic.id)]);
        setActivities(activities);
        setLatestActivity(latestActivity);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clone, topics, setTopics, addTopic, setActivities, setLatestActivity]);

  return (
    <div className="relative z-10 flex h-screen min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <VirtualWorld />
          </div>
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
              <div className="flex flex-col gap-2">
                <ControlModeToggle />
                <EncounterTrigger />
              </div>
            </div>
            <div className="absolute bottom-4 left-2 sm:bottom-6 sm:left-6">
              <ControlPad />
            </div>
            <div className="absolute bottom-20 left-1/2 max-w-[calc(100%-1rem)] -translate-x-1/2 sm:bottom-6">
              <TalkButton />
            </div>
            <div className="absolute bottom-4 left-1/2 flex w-full max-w-[calc(100%-1rem)] -translate-x-1/2 justify-center px-2 sm:bottom-6 sm:px-4">
              <ConversationModule />
            </div>
            <div className="absolute bottom-4 left-1/2 flex w-full max-w-[calc(100%-1rem)] -translate-x-1/2 justify-center px-2 sm:bottom-6 sm:px-4">
              <EncounterOverlay />
            </div>
          </div>
        </main>
      </div>
      <ChatPanel />
      <Overlays />
    </div>
  );
}
