'use client';

import { useAppStore } from '@/lib/store';
import CameraModeToggle from './CameraModeToggle';
import ControlPad from './ControlPad';
import EncounterTrigger from '@/components/encounter/EncounterTrigger';

const panelStyle = {
  background: 'rgba(12, 10, 26, 0.82)',
  backdropFilter: 'blur(20px) saturate(170%)',
  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
} as const;

const TAB_WIDTH = '2.25rem';

export default function WorldHudMenu() {
  const chatPanelOpen = useAppStore((s) => s.chatPanelOpen);
  const setChatPanelOpen = useAppStore((s) => s.setChatPanelOpen);
  const hudMenuOpen = useAppStore((s) => s.hudMenuOpen);
  const toggleHudMenu = useAppStore((s) => s.toggleHudMenu);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const controlMode = useAppStore((s) => s.controlMode);

  return (
    <div
      className="pointer-events-auto absolute bottom-4 right-0 z-20 sm:bottom-6"
      aria-label="ワールド操作メニュー"
    >
      <div
        className="flex items-end transition-transform duration-300 ease-out"
        style={{
          transform: hudMenuOpen
            ? 'translateX(0)'
            : `translateX(calc(100% - ${TAB_WIDTH}))`,
        }}
      >
        <div
          className="w-[min(280px,calc(100vw-2.75rem))] space-y-3 rounded-l-2xl border border-white/[0.1] border-r-0 p-3 shadow-[-16px_0_48px_rgba(0,0,0,0.45)]"
          style={panelStyle}
        >
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">
            Menu
          </div>

          <button
            type="button"
            onClick={() => setChatPanelOpen(true)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-colors lg:hidden ${
              chatPanelOpen
                ? 'border-[var(--color-neon-cyan)]/40 bg-[var(--color-neon-cyan)]/12 text-[var(--color-neon-cyan)]'
                : 'border-white/[0.1] bg-white/[0.04] text-white/88 hover:border-[var(--color-neon-cyan)]/30 hover:bg-white/[0.07]'
            }`}
            aria-label="チャットを開く"
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-neon-cyan)]">
              Chat
            </span>
            チャットを開く
          </button>

          <CameraModeToggle embedded />

          {cameraMode === 'third' ? (
            <p className="text-center text-[10px] leading-relaxed text-white/40">
              3rd 視点: 2本指ピンチ / トラックパッドでズーム
            </p>
          ) : null}

          {controlMode === 'manual' ? <ControlPad embedded /> : null}

          <EncounterTrigger embedded />
        </div>

        <button
          type="button"
          onClick={toggleHudMenu}
          className="flex w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-l-2xl border border-white/[0.12] border-r-0 py-4 shadow-[-8px_0_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-white/[0.06]"
          style={panelStyle}
          aria-label={hudMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={hudMenuOpen}
        >
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/45 [writing-mode:vertical-rl]">
            Menu
          </span>
          <span className="text-[14px] leading-none text-[#f3dfb0]/80" aria-hidden>
            {hudMenuOpen ? '›' : '‹'}
          </span>
        </button>
      </div>
    </div>
  );
}
