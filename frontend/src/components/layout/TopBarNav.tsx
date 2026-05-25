'use client';

import { useAppStore } from '@/lib/store';

export const TOP_NAV_BUTTONS = [
  { id: 'hobbies' as const, label: 'Hobby' },
  { id: 'encounters' as const, label: 'Logs' },
  { id: 'friends' as const, label: 'Friends' },
  { id: 'profile' as const, label: 'Profile' },
];

export default function TopBarNav({
  className = '',
  onNavigate,
  compact = false,
}: {
  className?: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const openOverlay = useAppStore((s) => s.openOverlay);
  const setOpenOverlay = useAppStore((s) => s.setOpenOverlay);

  return (
    <nav
      className={`flex w-full min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-2 ${className}`}
    >
      {TOP_NAV_BUTTONS.map((btn) => {
        const active = openOverlay === btn.id;
        return (
          <button
            key={btn.id}
            type="button"
            onClick={() => {
              setOpenOverlay(active ? null : btn.id);
              onNavigate?.();
            }}
            className={`flex items-center justify-center rounded-2xl border text-center transition-colors ${
              compact
                ? `h-9 min-w-[4.25rem] flex-1 px-2`
                : 'h-[40px] min-w-[4.5rem] flex-1 px-2 sm:h-[44px] sm:min-w-0 sm:px-4'
            } ${
              active
                ? 'border-[#caa85e]/45 bg-[#201a12] text-[#f3dfb0]'
                : 'border-white/[0.07] bg-white/[0.025] text-white/72 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <span
              className={`font-mono font-bold uppercase leading-none ${
                compact
                  ? 'text-[10px] tracking-[0.1em]'
                  : 'text-[11px] tracking-[0.12em] sm:text-[13px] sm:tracking-[0.16em]'
              }`}
            >
              {btn.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
