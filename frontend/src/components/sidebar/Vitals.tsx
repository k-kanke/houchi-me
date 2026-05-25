'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';

export default function Vitals() {
  const feedback = useAppStore((s) => s.feedback);
  const topics = useAppStore((s) => s.topics);

  const vitals = useMemo(() => {
    const fb = Object.values(feedback);
    const interested = fb.filter((f) => f.kind === 'interested').length;
    const more = fb.filter((f) => f.kind === 'more').length;
    const different = fb.filter((f) => f.kind === 'different').length;

    const focus = Math.min(95, 60 + more * 6 + interested * 2);
    const energy = Math.min(95, 50 + topics.length * 4 + interested * 3);
    const curiosity = Math.min(99, 65 + more * 4 + different * 5);
    return { focus, energy, curiosity };
  }, [feedback, topics.length]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          Vitals
        </div>
        <div className="font-mono text-[10px] text-[var(--color-neon-cyan)]">
          live
        </div>
      </div>
      <Bar label="集中" value={vitals.focus} color="var(--color-neon-cyan)" />
      <Bar label="活力" value={vitals.energy} color="var(--color-neon-pink)" />
      <Bar
        label="好奇心"
        value={vitals.curiosity}
        color="var(--color-neon-amber)"
      />
    </div>
  );
}

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-[10px] text-white/55">
          {value.toFixed(0)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.6))`,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
