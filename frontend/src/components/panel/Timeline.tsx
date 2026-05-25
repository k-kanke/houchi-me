'use client';

const ENTRIES = [
  {
    time: '14:23',
    place: '中央デスク',
    text: '「カフェ巡り × フィルムカメラ」を執筆',
    color: 'var(--color-neon-violet)',
  },
  {
    time: '13:48',
    place: '東の書架',
    text: '建築写真集を読了 · 6箇所をハイライト',
    color: 'var(--color-neon-cyan)',
  },
  {
    time: '12:30',
    place: '集会場',
    text: 'Sage と出会う → 共通Topic記録',
    color: 'var(--color-neon-pink)',
  },
  {
    time: '11:00',
    place: '天窓',
    text: '昨日の自動要約を生成',
    color: 'var(--color-neon-amber)',
  },
  {
    time: '09:42',
    place: '中央デスク',
    text: 'ナレッジベースに4件のバックリンク生成',
    color: 'var(--color-neon-green)',
  },
];

export default function Timeline() {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          今日のタイムライン
        </div>
        <div className="text-[10px] text-white/40">5 events</div>
      </div>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-white/[0.08]" />
        {ENTRIES.map((e) => (
          <div key={e.time} className="relative mb-3 last:mb-0">
            <div
              className="absolute -left-[10px] top-1.5 h-2 w-2 rounded-full"
              style={{ background: e.color, boxShadow: `0 0 6px ${e.color}` }}
            />
            <div className="flex items-baseline gap-2 text-[11.5px]">
              <span className="font-mono text-[10px] text-white/45">
                {e.time}
              </span>
              <span className="text-white/70">{e.place}</span>
            </div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-white/85">
              {e.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
