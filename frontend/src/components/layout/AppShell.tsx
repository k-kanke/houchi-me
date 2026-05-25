'use client';

import { useEffect } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import CommandBar from './CommandBar';
import Breadcrumb from '@/components/main/Breadcrumb';
import ViewTabs from '@/components/main/ViewTabs';
import HudCoord from '@/components/main/HudCoord';
import CameraButtons from '@/components/main/CameraButtons';
import ActivityBadge from '@/components/main/ActivityBadge';
import WorldStats from '@/components/main/WorldStats';
import { useAppStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { engine } from '@/lib/clone-engine';
import { todayKey } from '@/lib/util';
import TodayTopicView from '@/components/topic/TodayTopicView';
import ChatView from '@/components/chat/ChatView';
import VirtualWorld from '@/components/world/VirtualWorld';

export default function AppShell() {
  const tab = useAppStore((s) => s.viewTab);
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
      <div className="grid flex-1 min-h-0 grid-cols-[300px_1fr_320px]">
        <div className="min-h-0 border-r border-white/[0.06]">
          <Sidebar />
        </div>
        <main className="relative min-h-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-4 right-4 top-3 flex items-center justify-between">
              <Breadcrumb />
              <div className="pointer-events-auto">
                <ViewTabs />
              </div>
            </div>
            <div className="pointer-events-auto absolute right-4 top-14">
              <HudCoord />
            </div>
            {tab === 'world' && (
              <>
                <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2">
                  <CameraButtons />
                </div>
                <div className="pointer-events-auto absolute bottom-4 left-4">
                  <ActivityBadge />
                </div>
                <div className="pointer-events-auto absolute bottom-4 right-4">
                  <WorldStats />
                </div>
              </>
            )}
          </div>

          <div className="absolute inset-0">
            {tab === 'world' && <VirtualWorld />}
            {tab === 'note' && (
              <div className="no-scrollbar h-full overflow-y-auto p-8 pt-20">
                <TodayTopicView />
              </div>
            )}
            {tab === 'chat' && (
              <div className="h-full pt-16">
                <ChatView />
              </div>
            )}
          </div>
        </main>
        <div className="min-h-0 border-l border-white/[0.06]">
          <RightPanel />
        </div>
      </div>
      <CommandBar />
    </div>
  );
}
