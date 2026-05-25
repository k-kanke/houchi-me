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
      className="relative z-20 flex h-[72px] shrink-0 items-center justify-center border-b border-white/[0.05] px-3 sm:px-4"
      style={{
        background: 'rgba(10, 8, 32, 0.32)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      <nav className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-2">
        {NAV_BUTTONS.map((btn) => {
          const active = openOverlay === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setOpenOverlay(active ? null : btn.id)}
              className={`flex h-[40px] min-w-[4.5rem] flex-1 items-center justify-center rounded-2xl border px-2 text-center transition-colors sm:h-[44px] sm:min-w-0 sm:px-4 ${
                active
                  ? 'border-[#caa85e]/45 bg-[#201a12] text-[#f3dfb0]'
                  : 'border-white/[0.07] bg-white/[0.025] text-white/72 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] leading-none sm:text-[13px] sm:tracking-[0.16em]">
                {btn.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
