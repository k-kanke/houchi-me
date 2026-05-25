'use client';

import { useAppStore } from '@/lib/store';

export default function Stats() {
  const topics = useAppStore((s) => s.topics);
  const messages = useAppStore((s) => s.messages);
  const feedback = useAppStore((s) => s.feedback);
  const clone = useAppStore((s) => s.clone);

  const stats = [
    { label: 'ノート', value: 128 + topics.length, color: 'var(--color-neon-cyan)' },
    {
      label: '読書',
      value: 17 + Math.floor(topics.length * 1.5),
      color: 'var(--color-neon-violet)',
    },
    {
      label: '思考',
      value: 412 + messages.length,
      color: 'var(--color-neon-pink)',
    },
    {
      label: '同期率',
      value: `${(clone?.syncRate ?? 99.6).toFixed(1)}%`,
      color: 'var(--color-neon-amber)',
    },
  ];

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          直近7日
        </div>
        <div className="text-[10px] text-white/40">
          {Object.keys(feedback).length} fb
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
              {s.label}
            </div>
            <div
              className="mt-1 text-xl font-semibold"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
