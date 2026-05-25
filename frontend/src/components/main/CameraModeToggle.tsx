'use client';

import { useAppStore } from '@/lib/store';
import type { CameraMode, ControlMode } from '@/types';

const CAMERA_MODES: { id: CameraMode; label: string }[] = [
  { id: 'third', label: '3rd' },
  { id: 'first', label: '1st' },
];

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

export default function CameraModeToggle({ embedded = false }: { embedded?: boolean }) {
  const cameraMode = useAppStore((s) => s.cameraMode);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const controlMode = useAppStore((s) => s.controlMode);
  const setControlMode = useAppStore((s) => s.setControlMode);

  const inner = (
      <div className="space-y-1">
        <div>
          <div className="mb-1 px-1 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-white/28">
            Camera
          </div>
          <div className="relative flex rounded-full border border-white/[0.06] bg-black/20 p-[3px]">
            <div
              className="absolute bottom-[3px] top-[3px] w-[calc(50%-1.5px)] rounded-full border border-[#caa85e]/28 bg-[#201a12] shadow-[0_4px_14px_rgba(0,0,0,0.28)] transition-transform duration-200"
              style={{
                transform: cameraMode === 'third' ? 'translateX(0)' : 'translateX(calc(100% + 1.5px))',
              }}
            />
            {CAMERA_MODES.map((mode) => (
              <SegmentButton
                key={mode.id}
                active={cameraMode === mode.id}
                label={mode.label}
                onClick={() => setCameraMode(mode.id)}
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.06]" />

        <div>
          <div className="mb-1 px-1 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-white/28">
            Motion
          </div>
          <div className="relative flex rounded-full border border-[#caa85e]/18 bg-black/25 p-[3px]">
            <div
              className="absolute bottom-[3px] top-[3px] w-[calc(50%-1.5px)] rounded-full border border-[#caa85e]/36 bg-[#201a12] shadow-[0_4px_14px_rgba(0,0,0,0.28)] transition-transform duration-200"
              style={{
                transform: controlMode === 'auto' ? 'translateX(0)' : 'translateX(calc(100% + 1.5px))',
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
