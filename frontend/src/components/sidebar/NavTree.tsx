'use client';

const WORLDS = [
  { name: '叡智の図書館', sub: 'Sapientia', active: true },
  { name: '天文台', sub: 'Astrarium' },
  { name: 'アトリエ 03', sub: 'Atelier 03' },
];

const PAGES = [
  {
    name: 'ナレッジベース',
    children: ['エージェント設計の原理', '読書キュー', '毎日の振り返り'],
  },
  {
    name: 'AI メモリーボールト',
    children: ['長期記憶・信念', '会話ログ'],
  },
  {
    name: '目標と習慣',
    children: ['今月の問い', '読みたい本'],
  },
];

export default function NavTree() {
  return (
    <div className="glass rounded-2xl p-3 text-[12px]">
      <Section title="WORLDS">
        {WORLDS.map((w) => (
          <div
            key={w.name}
            className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${
              w.active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  w.active
                    ? 'bg-[var(--color-neon-cyan)]'
                    : 'bg-white/25'
                }`}
              />
              <span
                className={
                  w.active ? 'text-white' : 'text-white/55 hover:text-white/80'
                }
              >
                {w.name}
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              {w.sub}
            </span>
          </div>
        ))}
      </Section>

      <Section title="PAGES">
        {PAGES.map((p) => (
          <div key={p.name}>
            <div className="rounded-xl px-2.5 py-1.5 text-white/85 hover:bg-white/[0.03]">
              ▸ {p.name}
            </div>
            <div className="ml-3 border-l border-white/[0.06] pl-3">
              {p.children.map((c) => (
                <div
                  key={c}
                  className="rounded-md px-2 py-0.5 text-[11px] text-white/55 hover:bg-white/[0.03]"
                >
                  └ {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
