'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';

// d-pad 8 方向 + 中央リセット
const DIRECTIONS: { id: string; x: number; z: number; label: string }[] = [
  { id: 'NW', x: -0.7, z: -0.7, label: '↖' },
  { id: 'N', x: 0, z: -1, label: '↑' },
  { id: 'NE', x: 0.7, z: -0.7, label: '↗' },
  { id: 'W', x: -1, z: 0, label: '←' },
  { id: 'C', x: 0, z: 0, label: '·' },
  { id: 'E', x: 1, z: 0, label: '→' },
  { id: 'SW', x: -0.7, z: 0.7, label: '↙' },
  { id: 'S', x: 0, z: 1, label: '↓' },
  { id: 'SE', x: 0.7, z: 0.7, label: '↘' },
];

export default function ControlPad() {
  const controlMode = useAppStore((s) => s.controlMode);
  const setManualInput = useAppStore((s) => s.setManualInput);
  const [active, setActive] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);

  const release = useCallback(() => {
    activeRef.current = null;
    setActive(null);
    setManualInput({ x: 0, z: 0 });
  }, [setManualInput]);

  const press = useCallback(
    (dir: (typeof DIRECTIONS)[number]) => {
      if (dir.id === 'C') {
        release();
        return;
      }
      activeRef.current = dir.id;
      setActive(dir.id);
      setManualInput({ x: dir.x, z: dir.z });
    },
    [release, setManualInput],
  );

  // キーボード対応（WASD / 矢印キー）
  useEffect(() => {
    if (controlMode !== 'manual') {
      release();
      return;
    }
    const keys = new Set<string>();
    const compute = () => {
      let x = 0;
      let z = 0;
      if (keys.has('w') || keys.has('arrowup')) z -= 1;
      if (keys.has('s') || keys.has('arrowdown')) z += 1;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (x === 0 && z === 0) {
        setActive(null);
        setManualInput({ x: 0, z: 0 });
        return;
      }
      // 正規化
      const len = Math.hypot(x, z);
      const nx = x / len;
      const nz = z / len;
      // active 表示用に近い方向 id を求める
      const found = DIRECTIONS.reduce((best, d) => {
        if (d.id === 'C') return best;
        const dist = Math.hypot(d.x - nx, d.z - nz);
        return dist < best.dist ? { id: d.id, dist } : best;
      }, { id: '', dist: Infinity });
      setActive(found.id);
      setManualInput({ x: nx, z: nz });
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        keys.add(k);
        compute();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.delete(k)) {
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
  }, [controlMode, release, setManualInput]);

  if (controlMode !== 'manual') return null;

  return (
    <div
      className="pointer-events-auto select-none rounded-2xl border border-white/[0.08] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      style={{
        background: 'rgba(12, 10, 26, 0.72)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/45">
            Control Pad
          </div>
          <div className="text-[10.5px] text-white/55">手動操作 / WASD・矢印キー対応</div>
        </div>
        <div
          className={`font-mono text-[10.5px] ${
            active && active !== 'C' ? 'text-[var(--color-neon-cyan)]' : 'text-white/35'
          }`}
        >
          {active && active !== 'C' ? `MOVING · ${active}` : 'IDLE'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {DIRECTIONS.map((d) => {
          const isActive = active === d.id;
          const isCenter = d.id === 'C';
          return (
            <button
              key={d.id}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                press(d);
              }}
              onPointerUp={release}
              onPointerCancel={release}
              onPointerLeave={() => {
                if (activeRef.current === d.id) release();
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-[15px] transition-colors ${
                isCenter
                  ? 'border-white/10 bg-white/[0.02] text-white/30'
                  : isActive
                    ? 'border-[var(--color-neon-cyan)]/60 bg-[var(--color-neon-cyan)]/15 text-[var(--color-neon-cyan)]'
                    : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]'
              }`}
              aria-label={d.id}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
