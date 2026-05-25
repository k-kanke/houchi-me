'use client';

import { useAppStore } from '@/lib/store';
import type { ControlMode } from '@/types';

const MODES: { id: ControlMode; label: string; icon: string }[] = [
  { id: 'auto', label: '放置', icon: '☾' },
  { id: 'manual', label: '手動', icon: '✦' },
];

export default function ControlModeToggle() {
  const mode = useAppStore((s) => s.controlMode);
  const setMode = useAppStore((s) => s.setControlMode);

  return (
    <div className="glass flex flex-col gap-1 rounded-2xl p-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`flex h-10 w-10 flex-col items-center justify-center rounded-xl text-[9px] transition-colors ${
            mode === m.id
              ? 'bg-white/[0.08] text-[var(--color-neon-cyan)]'
              : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
          }`}
          title={m.label}
        >
          <span className="text-sm leading-none">{m.icon}</span>
          <span className="mt-0.5 leading-none">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
