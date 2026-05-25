'use client';

import { useAppStore } from '@/lib/store';

export default function TopBar() {
  const clone = useAppStore((s) => s.clone);
  return (
    <header className="glass-strong relative z-20 flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="relative h-7 w-7">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)]" />
          <div className="absolute inset-1 rounded-full bg-[#0a0820]" />
          <div
            className="absolute inset-2 rounded-full bg-[var(--color-neon-cyan)]"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
        </div>
        <div>
          <div className="neon-text text-sm font-semibold tracking-wide">
            放置me · CLONE OS
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
            叡智の図書館 / Sapientia v0.1
          </div>
        </div>
      </div>

      <div className="hidden flex-1 max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 md:flex">
        <span className="font-mono text-[11px] text-white/40">⌘K</span>
        <input
          className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
          placeholder="クローン、ノート、Topic、出会ったクローン..."
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/[0.06]">
          通知 · 3
        </button>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)]" />
          <span className="pr-2 text-xs text-white/80">
            {clone?.name ?? 'Guest'}
          </span>
        </div>
      </div>
    </header>
  );
}
