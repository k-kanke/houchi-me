'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import AppShell from '@/components/layout/AppShell';
import { storage } from '@/lib/storage';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const [hydrating, setHydrating] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const clone = useAppStore((s) => s.clone);
  const setClone = useAppStore((s) => s.setClone);
  const setTopics = useAppStore((s) => s.setTopics);
  const setActivities = useAppStore((s) => s.setActivities);
  const setLatestActivity = useAppStore((s) => s.setLatestActivity);
  const setMessages = useAppStore((s) => s.setMessages);
  const setFeedback = useAppStore((s) => s.setFeedback);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await storage.getClone();
        if (cancelled) return;
        if (!c) {
          router.replace('/onboarding');
          return;
        }
        setClone(c);
        const [topics, activities, latestActivity, messages, feedback] = await Promise.all([
          storage.getTopics(),
          storage.getTodayActivities(),
          storage.getLatestActivity(),
          storage.getMessages(),
          storage.getFeedback(),
        ]);
        if (cancelled) return;
        setTopics(topics);
        setActivities(activities);
        setLatestActivity(latestActivity);
        setMessages(messages);
        setFeedback(feedback);
      } catch (error) {
        console.warn('Failed to hydrate app data:', error);
        if (cancelled) return;
        setTopics([]);
        setActivities([]);
        setLatestActivity(null);
        setMessages([]);
        setFeedback({});
      } finally {
        if (!cancelled) {
          setHydrating(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    router,
    setClone,
    setTopics,
    setActivities,
    setLatestActivity,
    setMessages,
    setFeedback,
  ]);

  if (!clone || hydrating || showLoader) {
    return (
      <>
        {showLoader && <Loader onDone={() => setShowLoader(false)} />}
      </>
    );
  }

  return <AppShell />;
}
