'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';

const WILD_AVATARS = [
  { name: 'Sage', color: '#f0a030' },
  { name: 'Echo', color: '#4ff5e7' },
];

export default function EncounterTrigger() {
  const encounter = useAppStore((s) => s.encounter);
  const clone = useAppStore((s) => s.clone);
  const topics = useAppStore((s) => s.topics);
  const startEncounter = useAppStore((s) => s.startEncounter);
  const [loading, setLoading] = useState(false);

  // Show only when no encounter is active and clone exists
  if (encounter || !clone) return null;

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    const avatar = WILD_AVATARS[Math.floor(Math.random() * WILD_AVATARS.length)];
    const recentTopics = topics.slice(0, 7);

    try {
      const res = await fetch('/api/encounter/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clone,
          recentTopics,
          avatarName: avatar.name,
        }),
      });

      if (!res.ok) return;

      const { sessionId, message, avatarName } = (await res.json()) as {
        sessionId: string;
        message: string;
        avatarName: string;
      };

      startEncounter(sessionId, avatarName, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/10 px-4 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-all hover:scale-105 disabled:opacity-60"
      style={{
        background:
          'linear-gradient(135deg, rgba(163,120,255,0.35), rgba(79,245,231,0.2))',
        backdropFilter: 'blur(18px) saturate(160%)',
      }}
    >
      <div
        className="h-6 w-6 flex-shrink-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #a378ff, #0a0820 80%)',
          boxShadow: '0 0 14px #a378ff99',
        }}
      />
      <span className="text-[12.5px] font-medium text-white">
        {loading ? '準備中…' : 'アバターと話す'}
      </span>
    </button>
  );
}
