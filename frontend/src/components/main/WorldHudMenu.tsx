'use client';

import { useAppStore } from '@/lib/store';
import TopBarNav from '@/components/layout/TopBarNav';
import CameraModeToggle from './CameraModeToggle';
import ControlPad from './ControlPad';
import EncounterTrigger from '@/components/encounter/EncounterTrigger';

const panelStyle = {
  background: 'rgba(12, 10, 26, 0.82)',
  backdropFilter: 'blur(20px) saturate(170%)',
  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
} as const;

/** メニューパネル開閉（にょーん） */
const PANEL_EASE = 'cubic-bezier(0.33, 1.18, 0.68, 1)';
const PANEL_TRANSITION_MS = 420;

const SIDE_TAB_CLASS =
  'relative flex w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-l-2xl border border-white/[0.12] border-r-0 py-4 shadow-[-8px_0_24px_rgba(0,0,0,0.35)] transition-colors duration-200 hover:bg-white/[0.08]';

function ChatSideTab() {
  const chatPanelOpen = useAppStore((s) => s.chatPanelOpen);
  const setChatPanelOpen = useAppStore((s) => s.setChatPanelOpen);

  return (
    <button
      type="button"
      onClick={() => setChatPanelOpen(!chatPanelOpen)}
      className={`${SIDE_TAB_CLASS} z-[31]`}
      style={panelStyle}
      aria-label={chatPanelOpen ? 'チャットを閉じる' : 'チャットを開く'}
      aria-expanded={chatPanelOpen}
    >
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/55 [writing-mode:vertical-rl]">
        Chat
      </span>
      <span
        className={`text-[16px] leading-none transition-transform duration-[420ms] ${
          chatPanelOpen ? 'text-white/70' : 'text-[var(--color-neon-cyan)]'
        }`}
        style={{ transitionTimingFunction: PANEL_EASE }}
        aria-hidden
      >
        {chatPanelOpen ? '›' : '‹'}
      </span>
    </button>
  );
}

function HudMenuItems({ showChatEntry }: { showChatEntry: boolean }) {
  const chatPanelOpen = useAppStore((s) => s.chatPanelOpen);
  const toggleChatPanel = useAppStore((s) => s.toggleChatPanel);
  const controlMode = useAppStore((s) => s.controlMode);
  const encounter = useAppStore((s) => s.encounter);
  const clone = useAppStore((s) => s.clone);
  const showEncounterBtn = showChatEntry && !encounter && !!clone;

  const chatButton = (
    <button
      type="button"
      onClick={() => toggleChatPanel()}
      className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl border text-center transition-colors ${
        showEncounterBtn ? 'w-full px-2 py-2' : 'w-full px-3 py-2.5'
      } ${
        chatPanelOpen
          ? 'border-[var(--color-neon-cyan)]/40 bg-[var(--color-neon-cyan)]/12'
          : 'border-white/[0.1] bg-white/[0.04] hover:border-[var(--color-neon-cyan)]/30 hover:bg-white/[0.07]'
      }`}
      aria-label="自分のクローンとチャットする"
    >
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--color-neon-cyan)]">
        You ↔ Clone
      </span>
      <span
        className={`font-medium text-white/92 ${
          showEncounterBtn ? 'text-[11px] leading-tight' : 'text-[13px]'
        }`}
      >
        自分のクローンと会話
      </span>
      <span
        className={`text-white/45 ${showEncounterBtn ? 'text-[9px] leading-snug' : 'text-[10px]'}`}
      >
        {showEncounterBtn ? '質問・深掘り' : 'あなたが直接、質問・深掘りする'}
      </span>
    </button>
  );

  return (
    <div className="space-y-3">
      {showChatEntry ? (
        showEncounterBtn ? (
          <div className="grid grid-cols-2 gap-2">
            {chatButton}
            <EncounterTrigger embedded compact />
          </div>
        ) : (
          chatButton
        )
      ) : null}

      <CameraModeToggle embedded />

      {controlMode === 'manual' ? <ControlPad embedded /> : null}

      {!showChatEntry ? <EncounterTrigger embedded /> : null}
    </div>
  );
}

/** 大画面: 右下に折りたたみ可能なオーバーレイメニュー */
function WorldHudMenuOverlay() {
  const hudMenuOpen = useAppStore((s) => s.hudMenuOpen);
  const toggleHudMenu = useAppStore((s) => s.toggleHudMenu);

  return (
    <div
      className="pointer-events-auto absolute bottom-4 right-0 z-20 hidden max-w-[calc(100vw-0.5rem)] items-end lg:flex sm:bottom-6"
      aria-label="ワールド操作メニュー"
    >
      <div
        className={`overflow-hidden will-change-[max-width,opacity] ${hudMenuOpen ? '' : 'pointer-events-none'}`}
        style={{
          maxWidth: hudMenuOpen ? 'min(280px, calc(100vw - 2.75rem))' : 0,
          opacity: hudMenuOpen ? 1 : 0,
          transition: `max-width ${PANEL_TRANSITION_MS}ms ${PANEL_EASE}, opacity ${PANEL_TRANSITION_MS * 0.75}ms ${PANEL_EASE}`,
        }}
      >
        <div
          className="w-[min(280px,calc(100vw-2.75rem))] origin-right space-y-3 rounded-l-2xl border border-white/[0.1] border-r-0 p-3 shadow-[-16px_0_48px_rgba(0,0,0,0.45)] will-change-transform"
          style={{
            ...panelStyle,
            transform: hudMenuOpen
              ? 'translateX(0) scale(1)'
              : 'translateX(14px) scale(0.97)',
            opacity: hudMenuOpen ? 1 : 0,
            transition: `transform ${PANEL_TRANSITION_MS}ms ${PANEL_EASE}, opacity ${PANEL_TRANSITION_MS * 0.7}ms ${PANEL_EASE}`,
          }}
        >
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">
            Menu
          </div>
          <HudMenuItems showChatEntry={false} />
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-1">
        <ChatSideTab />
        <button
          type="button"
          onClick={toggleHudMenu}
          className={`${SIDE_TAB_CLASS} z-30`}
          style={panelStyle}
          aria-label={hudMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={hudMenuOpen}
        >
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/55 [writing-mode:vertical-rl]">
            Menu
          </span>
          <span
            className="inline-block text-[16px] leading-none text-[#f3dfb0] transition-transform duration-[420ms]"
            style={{
              transform: hudMenuOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transitionTimingFunction: PANEL_EASE,
            }}
            aria-hidden
          >
            ‹
          </span>
        </button>
      </div>
    </div>
  );
}

/** スマホ〜タブレット: 画面下40%の固定メニューパネル */
export function WorldHudMenuDock() {
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const toggleMobileNav = useAppStore((s) => s.toggleMobileNav);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);

  return (
    <section
      className="pointer-events-auto flex h-full min-h-0 flex-col border-t border-white/[0.08] lg:hidden"
      style={panelStyle}
      aria-label="ワールド操作メニュー"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-xl border border-white/[0.1] bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
          aria-label={mobileNavOpen ? 'ナビを閉じる' : 'ナビを開く'}
          aria-expanded={mobileNavOpen}
        >
          <span
            className={`block h-[2px] w-[18px] rounded-full bg-[#f3dfb0] transition-transform duration-200 ${
              mobileNavOpen ? 'translate-y-[3.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-[2px] w-[18px] rounded-full bg-[#f3dfb0] transition-opacity duration-200 ${
              mobileNavOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-[2px] w-[18px] rounded-full bg-[#f3dfb0] transition-transform duration-200 ${
              mobileNavOpen ? '-translate-y-[3.5px] -rotate-45' : ''
            }`}
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">
            Menu
          </div>
          <div className="truncate text-[12px] text-white/55">
            {mobileNavOpen ? 'Hobby · Logs · Friends · Profile' : '操作パネル'}
          </div>
        </div>
      </div>

      <div
        className={`shrink-0 overflow-hidden border-b border-white/[0.06] transition-[max-height] duration-300 ease-out ${
          mobileNavOpen ? 'max-h-28' : 'max-h-0'
        }`}
      >
        <div className="px-3 py-2">
          <TopBarNav compact onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
        <HudMenuItems showChatEntry />
      </div>
    </section>
  );
}

export default function WorldHudMenu() {
  return <WorldHudMenuOverlay />;
}
