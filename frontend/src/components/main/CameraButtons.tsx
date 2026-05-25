'use client';

import { useAppStore } from '@/lib/store';
import type { CameraMode } from '@/types';

const MODES: { id: CameraMode; label: string; icon: string }[] = [
  { id: 'follow', label: '追従', icon: '◉' },
  { id: 'orbit', label: '軌道', icon: '◯' },
  { id: 'top', label: '俯瞰', icon: '▢' },
  { id: 'cinema', label: 'シネマ', icon: '▷' },
];

export default function CameraButtons() {
  const mode = useAppStore((s) => s.cameraMode);
  const setMode = useAppStore((s) => s.setCameraMode);

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
