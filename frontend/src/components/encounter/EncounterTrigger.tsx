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
      className="pointer-events-auto flex w-full items-center justify-center rounded-full border border-white/[0.08] px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.38)] transition-colors hover:border-[#caa85e]/22 hover:bg-white/[0.05] disabled:opacity-60"
      style={{
        background: 'rgba(12, 10, 26, 0.72)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
      }}
    >
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/76">
        {loading ? 'Preparing…' : 'Talk'}
      </span>
    </button>
  );
}
