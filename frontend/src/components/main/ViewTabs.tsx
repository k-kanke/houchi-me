'use client';

import { useAppStore } from '@/lib/store';
import type { ViewTab } from '@/types';

const TABS: { id: ViewTab; label: string }[] = [
  { id: 'note', label: 'ノート' },
  { id: 'world', label: 'ワールド' },
  { id: 'chat', label: '対話' },
];

export default function ViewTabs() {
  const tab = useAppStore((s) => s.viewTab);
  const setTab = useAppStore((s) => s.setViewTab);
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
            tab === t.id
              ? 'bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] text-[#06060c]'
              : 'text-white/60 hover:text-white/90'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
