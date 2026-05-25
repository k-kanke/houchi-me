'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';

const STICK_RADIUS = 42;

function DirectionArrow({
  direction,
  active,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  active: boolean;
}) {
  const rotation =
    direction === 'up'
      ? 0
      : direction === 'right'
        ? 90
        : direction === 'down'
          ? 180
          : -90;

  const position =
    direction === 'up'
      ? 'left-1/2 top-2 -translate-x-1/2'
      : direction === 'down'
        ? 'bottom-2 left-1/2 -translate-x-1/2'
        : direction === 'left'
          ? 'left-2 top-1/2 -translate-y-1/2'
          : 'right-2 top-1/2 -translate-y-1/2';

  return (
    <span
      className={`pointer-events-none absolute ${position} flex h-5 w-5 items-center justify-center transition-colors`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${active ? 'text-[#f3dfb0]' : 'text-white/28'}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        fill="currentColor"
      >
        <path d="M12 6l-6 8h12L12 6z" />
      </svg>
    </span>
  );
}

export default function ControlPad({ embedded = false }: { embedded?: boolean }) {
  const controlMode = useAppStore((s) => s.controlMode);
  const setManualInput = useAppStore((s) => s.setManualInput);
  const [stick, setStick] = useState({ x: 0, z: 0 });
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const applyInput = useCallback(
    (x: number, z: number) => {
      setStick({ x, z });
      setManualInput({ x, z });
    },
    [setManualInput],
  );

  const release = useCallback(() => {
    pointerIdRef.current = null;
    applyInput(0, 0);
  }, [applyInput]);

  const updateFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const distance = Math.hypot(dx, dy);
      const clamped = distance > STICK_RADIUS ? STICK_RADIUS / distance : 1;
      const nx = (dx * clamped) / STICK_RADIUS;
      const nz = (dy * clamped) / STICK_RADIUS;
      applyInput(nx, nz);
    },
    [applyInput],
  );

  useEffect(() => {
    if (controlMode !== 'manual') return;

    const keys = new Set<string>();
    const compute = () => {
      let x = 0;
      let z = 0;
      if (keys.has('w') || keys.has('arrowup')) z -= 1;
      if (keys.has('s') || keys.has('arrowdown')) z += 1;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (x === 0 && z === 0) {
        applyInput(0, 0);
        return;
      }
      const len = Math.hypot(x, z);
      applyInput(x / len, z / len);
    };

    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        keys.add(key);
        compute();
      }
    };

    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keys.delete(key)) {
        e.preventDefault();
        compute();
      }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [applyInput, controlMode]);

  if (controlMode !== 'manual') return null;

  const knobX = stick.x * STICK_RADIUS;
  const knobY = stick.z * STICK_RADIUS;
  const stickArea = (
        <div
          ref={padRef}
          onPointerDown={(e) => {
            pointerIdRef.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromClientPoint(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (pointerIdRef.current !== e.pointerId) return;
            updateFromClientPoint(e.clientX, e.clientY);
          }}
          onPointerUp={release}
          onPointerCancel={release}
          className="relative h-[112px] w-[112px] rounded-full border border-white/[0.08] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_46%,rgba(0,0,0,0.18)_100%)] shadow-[inset_0_1px_14px_rgba(255,255,255,0.04)]"
        >
          <DirectionArrow direction="up" active={stick.z < -0.15} />
          <DirectionArrow direction="down" active={stick.z > 0.15} />
          <DirectionArrow direction="left" active={stick.x < -0.15} />
          <DirectionArrow direction="right" active={stick.x > 0.15} />
          <div className="absolute inset-[14px] rounded-full border border-white/[0.05]" />
          <div className="absolute left-1/2 top-1/2 h-px w-[72px] -translate-x-1/2 -translate-y-1/2 bg-white/[0.06]" />
          <div className="absolute left-1/2 top-1/2 h-[72px] w-px -translate-x-1/2 -translate-y-1/2 bg-white/[0.06]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-[42px] w-[42px] rounded-full border border-[#caa85e]/26 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.22),rgba(243,223,176,0.12)_38%,rgba(32,26,18,0.96)_100%)] shadow-[0_8px_18px_rgba(0,0,0,0.32)] transition-transform"
              style={{
                transform: `translate(${knobX}px, ${knobY}px)`,
              }}
            />
          </div>
        </div>
  );

  if (embedded) {
    return (
      <div className="pointer-events-auto w-full select-none">
        <div className="mb-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-white/28">
          Move
        </div>
        <div className="flex justify-center">{stickArea}</div>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-auto select-none rounded-[28px] border border-white/[0.08] p-4 shadow-[0_10px_34px_rgba(0,0,0,0.45)]"
      style={{
        background: 'rgba(12, 10, 26, 0.72)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
      }}
    >
      <div className="flex justify-center">{stickArea}</div>
    </div>
  );
}
