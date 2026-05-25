'use client';

import { useAppStore } from '@/lib/store';

function formatTime(value: string): string {
  const isoTime = value.match(/T(\d{2}:\d{2})/)?.[1];
  if (isoTime) return isoTime;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NowCard() {
  const latestActivity = useAppStore((s) => s.latestActivity);
  const topic = useAppStore((s) => s.topics[0]);
  const clone = useAppStore((s) => s.clone);
  const body = latestActivity
    ? latestActivity.summary
    : topic
      ? `今日のTopic「${topic.title}」を整理しています。`
      : '今日の活動はまだ記録されていません。Topic を生成するとここに表示されます。';

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
          いま、{clone?.name ?? 'クローン'} がいる場所
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/55">
          <span>{latestActivity?.location ?? '叡智の図書館'}</span>
          {latestActivity && (
            <>
              <span className="text-white/25">·</span>
              <span className="font-mono">{formatTime(latestActivity.occurredAt)}</span>
            </>
          )}
        </div>
        <div className="mt-2 text-[13px] leading-relaxed text-white/90">
          {body}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-neon-amber)] to-[var(--color-neon-pink)]"
            style={{ width: latestActivity ? '86%' : '28%' }}
          />
        </div>
      </div>
    </div>
  );
}
