'use client';

import { useAppStore } from '@/lib/store';

export default function NowCard() {
  const topic = useAppStore((s) => s.topics[0]);
  const clone = useAppStore((s) => s.clone);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-neon-amber)]/30 bg-gradient-to-br from-[var(--color-neon-amber)]/12 via-white/[0.03] to-transparent p-4">
      <div
        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-[var(--color-neon-amber)]/10 to-transparent"
        style={{ animation: 'scan 4s ease-in-out infinite' }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-neon-amber)]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-neon-amber)]"
            style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
          />
          いま、{clone?.name ?? 'クローン'} が考えていること
        </div>
        <div className="mt-2 text-[13px] leading-relaxed text-white/90">
          {topic
            ? `「${topic.title}」を東の書架と集会場の記憶から再構成中…`
            : '新しいTopicを生成中…関連する書架と思索を辿っています'}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-neon-amber)] to-[var(--color-neon-pink)]"
            style={{ width: '68%' }}
          />
        </div>
      </div>
    </div>
  );
}
