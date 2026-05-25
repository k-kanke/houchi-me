'use client';

import { useAppStore } from '@/lib/store';

const NAV_BUTTONS = [
  { id: 'hobbies' as const, label: 'Hobby' },
  { id: 'encounters' as const, label: 'Logs' },
  { id: 'friends' as const, label: 'Friends' },
  { id: 'profile' as const, label: 'Profile' },
];

export default function TopBar() {
  const openOverlay = useAppStore((s) => s.openOverlay);
  const setOpenOverlay = useAppStore((s) => s.setOpenOverlay);

  return (
    <header
      className="relative z-20 flex h-[72px] items-center justify-center border-b border-white/[0.05] px-4"
      style={{
        background: 'rgba(10, 8, 32, 0.32)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      <nav className="flex w-full items-center gap-2">
        {NAV_BUTTONS.map((btn) => {
          const active = openOverlay === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setOpenOverlay(active ? null : btn.id)}
              className={`flex h-[44px] flex-1 items-center justify-center rounded-2xl border px-4 text-center transition-colors ${
                active
                  ? 'border-[#caa85e]/45 bg-[#201a12] text-[#f3dfb0]'
                  : 'border-white/[0.07] bg-white/[0.025] text-white/72 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <span className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] leading-none">
                {btn.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
