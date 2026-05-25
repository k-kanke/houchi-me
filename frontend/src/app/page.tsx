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
  const setMessages = useAppStore((s) => s.setMessages);
  const setFeedback = useAppStore((s) => s.setFeedback);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await storage.getClone();
      if (cancelled) return;
      if (!c) {
        router.replace('/onboarding');
        return;
      }
      setClone(c);
      const [topics, messages, feedback] = await Promise.all([
        storage.getTopics(),
        storage.getMessages(),
        storage.getFeedback(),
      ]);
      if (cancelled) return;
      setTopics(topics);
      setMessages(messages);
      setFeedback(feedback);
      setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setClone, setTopics, setMessages, setFeedback]);

  if (!clone || hydrating || showLoader) {
    return (
      <>
        {showLoader && <Loader onDone={() => setShowLoader(false)} />}
      </>
    );
  }

  return <AppShell />;
}
