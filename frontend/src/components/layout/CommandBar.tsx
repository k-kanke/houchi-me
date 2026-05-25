'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';

const QUICK = ['今日を要約', '明日を計画', '西の書架へ', '集会場へ', '思索モード'];

export default function CommandBar() {
  const [text, setText] = useState('');
  const clone = useAppStore((s) => s.clone);
  const setViewTab = useAppStore((s) => s.setViewTab);

  return (
    <div className="glass-strong relative z-20 flex items-center gap-3 px-5 py-3">
      <div className="flex items-center gap-2 rounded-full border border-[var(--color-neon-violet)]/30 bg-[var(--color-neon-violet)]/10 px-3 py-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-neon-violet)]"
          style={{ animation: 'pulse 1.8s ease-in-out infinite' }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-neon-violet)]">
          {clone?.name ?? 'CLONE'} へ指示
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          placeholder="西の書架へ移動して、認知科学の本を読み込んで…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              setViewTab('chat');
              setText('');
            }
          }}
        />
        <span className="font-mono text-[10px] text-white/35">⏎</span>
      </div>
      <div className="hidden gap-1.5 md:flex">
        {QUICK.map((q) => (
          <button
            key={q}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/65 hover:bg-white/[0.06]"
          >
            {q}
          </button>
        ))}
      </div>
      <button className="rounded-full bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-4 py-1.5 text-[11px] font-medium text-[#06060c]">
        送信
      </button>
    </div>
  );
}
