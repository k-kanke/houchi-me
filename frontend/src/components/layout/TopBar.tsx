'use client';

import { useAppStore } from '@/lib/store';

const NAV_BUTTONS = [
  { id: 'hobbies' as const, label: 'ハマっている趣味', icon: '✦' },
  { id: 'friends' as const, label: 'フレンド', icon: '◍' },
  { id: 'profile' as const, label: 'プロフィール', icon: '◉' },
];

export default function TopBar() {
  const openOverlay = useAppStore((s) => s.openOverlay);
  const setOpenOverlay = useAppStore((s) => s.setOpenOverlay);

  return (
    <header
      className="relative z-20 flex items-center border-b border-white/[0.06] px-5 py-3"
      style={{
        background: 'rgba(10, 8, 32, 0.35)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
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

      <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {NAV_BUTTONS.map((btn) => {
          const active = openOverlay === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setOpenOverlay(active ? null : btn.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] transition-colors ${
                active
                  ? 'border-[var(--color-neon-cyan)]/40 bg-white/[0.08] text-[var(--color-neon-cyan)]'
                  : 'border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="text-[13px] leading-none">{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
