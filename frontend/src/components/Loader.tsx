'use client';

import { useEffect, useState } from 'react';

const BOOT_LINES = [
  '⟶ クローン OS を初期化',
  '⟶ ニューラルウェイトをロード中',
  '⟶ 仮想世界「叡智の図書館」に接続',
  '⟶ 他クローンとのリンクを確立',
  '⟶ 今日の探索プランを準備中',
  '⟶ クローンを召喚 · READY',
];

export default function Loader({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => Math.min(i + 1, BOOT_LINES.length - 1));
    }, 380);
    const t = setTimeout(() => {
      clearInterval(interval);
      onDone();
    }, 2500);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[#06060c] text-white">
      <div className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(600px 400px at 50% 40%, rgba(163,120,255,0.4), transparent 70%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-3">
        <div className="relative h-20 w-20">
          <div
            className="absolute inset-0 rounded-full border border-white/15"
            style={{ animation: 'rotateRing 4s linear infinite' }}
          />
          <div
            className="absolute inset-2 rounded-full border border-[var(--color-neon-cyan)]/40 border-t-[var(--color-neon-cyan)]"
            style={{ animation: 'rotateRing 1.4s linear infinite reverse' }}
          />
          <div
            className="absolute inset-6 rounded-full bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)]"
            style={{ animation: 'corePulse 1.8s ease-in-out infinite' }}
          />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">
          Clone · OS · v0.1
        </div>
        <div className="neon-text text-2xl font-semibold tracking-wider">
          放置me
        </div>
        <div className="text-xs text-white/50">仮想世界に接続中...</div>
      </div>

      <div className="relative h-1 w-72 overflow-hidden rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--color-neon-violet)] via-[var(--color-neon-pink)] to-[var(--color-neon-cyan)]"
          style={{ animation: 'progress 2.4s ease-out forwards' }}
        />
      </div>

      <div className="font-mono text-[11px] text-white/55">
        {BOOT_LINES.slice(0, idx + 1).map((l, i) => (
          <div key={i} className={i === idx ? 'text-white' : 'opacity-50'}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
