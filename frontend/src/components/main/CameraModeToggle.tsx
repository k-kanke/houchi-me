'use client';

import { useAppStore } from '@/lib/store';
import type { ControlMode } from '@/types';

const CONTROL_MODES: { id: ControlMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'manual', label: 'Manual' },
];

function SegmentButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative z-10 flex flex-1 flex-col items-center justify-center rounded-full px-2.5 py-2 transition-colors ${
        active
          ? 'text-[#f3dfb0]'
          : 'text-white/54 hover:text-white/82'
      }`}
    >
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] leading-none">
        {label}
      </span>
    </button>
  );
}

const panelGlass = {
  background: 'rgba(12, 10, 26, 0.72)',
  backdropFilter: 'blur(20px) saturate(170%)',
  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
} as const;

/** 放置 / 手動（Auto・Manual）の切り替えのみ。視点は第三者固定。 */
export default function CameraModeToggle({ embedded = false }: { embedded?: boolean }) {
  const controlMode = useAppStore((s) => s.controlMode);
  const setControlMode = useAppStore((s) => s.setControlMode);

  const inner = (
    <div>
      <div className="mb-1 px-1 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-white/28">
        Motion
      </div>
      <div className="relative flex w-full rounded-full border border-[#caa85e]/18 bg-black/25 p-[3px]">
        <span
          aria-hidden
          className="pointer-events-none absolute top-[3px] bottom-[3px] z-0 w-[calc(50%-4.5px)] rounded-full border border-[#caa85e]/36 bg-[#201a12] shadow-[0_4px_14px_rgba(0,0,0,0.28)] transition-[left] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
          style={{
            left: controlMode === 'auto' ? '3px' : 'calc(50% + 1.5px)',
          }}
        />
        {CONTROL_MODES.map((mode) => (
          <SegmentButton
            key={mode.id}
            active={controlMode === mode.id}
            label={mode.label}
            onClick={() => setControlMode(mode.id)}
          />
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return <div className="w-full">{inner}</div>;
  }

  return (
    <section
      className="pointer-events-auto w-[128px] rounded-[16px] border border-white/[0.08] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.34)]"
      style={panelGlass}
    >
      {inner}
    </section>
  );
}
