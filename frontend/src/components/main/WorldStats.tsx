'use client';

export default function WorldStats() {
  return (
    <div className="glass rounded-2xl px-3 py-2 font-mono text-[10px] leading-tight text-white/55">
      <div className="flex gap-3">
        <span>
          FPS <span className="text-[var(--color-neon-cyan)]">60</span>
        </span>
        <span>
          DRAW <span className="text-white/85">128</span>
        </span>
        <span>
          BLOOM <span className="text-white/85">0.85</span>
        </span>
      </div>
      <div className="text-white/35">叡智の図書館 · LAYER 03</div>
    </div>
  );
}
