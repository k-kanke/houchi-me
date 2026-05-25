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
  const chatPanelOpen = useAppStore((s) => s.chatPanelOpen);
  const toggleChatPanel = useAppStore((s) => s.toggleChatPanel);

  return (
    <header
      className="relative z-20 flex h-[72px] shrink-0 items-center border-b border-white/[0.05] px-3 sm:px-4"
      style={{
        background: 'rgba(10, 8, 32, 0.32)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      <button
        type="button"
        onClick={toggleChatPanel}
        className={`mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors lg:hidden ${
          chatPanelOpen
            ? 'border-[var(--color-neon-cyan)]/45 bg-[var(--color-neon-cyan)]/12 text-[var(--color-neon-cyan)]'
            : 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:border-white/[0.14] hover:bg-white/[0.06]'
        }`}
        aria-label={chatPanelOpen ? 'チャットを閉じる' : 'チャットを開く'}
        aria-expanded={chatPanelOpen}
      >
        <span className="flex flex-col items-center justify-center gap-[5px]" aria-hidden>
          <span className="block h-[2px] w-[18px] rounded-full bg-current" />
          <span className="block h-[2px] w-[18px] rounded-full bg-current" />
          <span className="block h-[2px] w-[18px] rounded-full bg-current" />
        </span>
      </button>
      <nav className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:gap-2">
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
