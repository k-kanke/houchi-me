'use client';

import { useAppStore } from '@/lib/store';

export default function ActivityBadge() {
  const mira = useAppStore((s) => s.worldAvatars[0]);
  return (
    <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px]">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-neon-green)]"
        style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
      />
      <span className="text-white/75">{mira?.activity ?? '思索中'}</span>
    </div>
  );
}
