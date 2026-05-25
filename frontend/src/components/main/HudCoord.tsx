'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

export default function HudCoord() {
  const mira = useAppStore((s) => s.worldAvatars[0]);
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(
        `${String(d.getHours()).padStart(2, '0')}:${String(
          d.getMinutes(),
        ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pos = mira?.position ?? [0, 0, 0];

  return (
    <div className="glass rounded-2xl px-3 py-2 font-mono text-[10px] leading-tight text-white/65">
      <div className="text-white/35">COORD</div>
      <div>X {pos[0].toFixed(2)}</div>
      <div>Y {pos[1].toFixed(2)}</div>
      <div>Z {pos[2].toFixed(2)}</div>
      <div className="mt-1 text-white/35">TIME</div>
      <div>{now}</div>
    </div>
  );
}
