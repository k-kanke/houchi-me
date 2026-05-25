'use client';

import { useAppStore } from '@/lib/store';

const ACTIVITY_COLORS = [
  'var(--color-neon-violet)',
  'var(--color-neon-cyan)',
  'var(--color-neon-pink)',
  'var(--color-neon-amber)',
  'var(--color-neon-green)',
];

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

export default function Timeline() {
  const activities = useAppStore((s) => s.activities);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          今日のタイムライン
        </div>
        <div className="text-[10px] text-white/40">
          {activities.length} events
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-5 text-center text-[12px] leading-relaxed text-white/45">
          まだ今日の活動はありません。
          <br />
          Topic が生成されると活動履歴が表示されます。
        </div>
      ) : (
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-1 bottom-1 w-px bg-white/[0.08]" />
          {activities.map((activity, index) => {
            const color = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
            return (
              <div key={activity.id} className="relative mb-3 last:mb-0">
                <div
                  className="absolute -left-[10px] top-1.5 h-2 w-2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
                <div className="flex items-baseline gap-2 text-[11.5px]">
                  <span className="font-mono text-[10px] text-white/45">
                    {formatTime(activity.occurredAt)}
                  </span>
                  <span className="text-white/70">{activity.location}</span>
                </div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-white/85">
                  {activity.summary}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
