'use client';

import { useAppStore } from '@/lib/store';

function formatUptime(createdAt?: string): string {
  if (!createdAt) return '0時間00分';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${h}時間${String(m).padStart(2, '0')}分`;
}

const PERSONALITY_LABELS: Record<string, string> = {
  stay: '今のままの自分',
  outgoing: '少し外向的',
  adventurous: '少し冒険的',
  craft: '少し職人気質',
  creative: '少しクリエイティブ',
  social: '少し社交的',
  stoic: '少しストイック',
};

const EXPLORATION_LABELS: Record<string, string> = {
  depth: '深掘り型',
  breadth: '拡散型',
  social: '社交型',
  reverse: '反転型',
};

export default function CloneStatusCard() {
  const clone = useAppStore((s) => s.clone);
  if (!clone) return null;
  const sync = clone.syncRate.toFixed(1);

  return (
    <div className="glass relative rounded-2xl p-4">
      <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--color-neon-violet)]/60 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0">
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] opacity-90"
            style={{ animation: 'breathe 3s ease-in-out infinite' }}
          />
          <div className="absolute inset-1 rounded-xl bg-[#0a0820]" />
          <div
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-neon-cyan)]"
            style={{ animation: 'pulse 1.6s ease-in-out infinite' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-wide">
              {clone.name}
            </span>
            <span
              className="inline-flex h-2 w-2 rounded-full bg-[var(--color-neon-green)]"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
              title="active"
            />
          </div>
          <div className="text-[11px] text-white/55">
            {EXPLORATION_LABELS[clone.explorationType]} · {clone.mbti} ·{' '}
            {PERSONALITY_LABELS[clone.personalityShift]}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <Meta label="稼働" value={formatUptime(clone.createdAt)} />
        <Meta label="同期率" value={`${sync}%`} accent />
        <Meta label="ノート" value="128" />
        <Meta label="気分" value="探索的" />
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[12.5px] font-medium ${
          accent ? 'text-[var(--color-neon-cyan)]' : 'text-white/90'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
