'use client';

import { useAppStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { nowIso, uuid, clamp } from '@/lib/util';
import type { FeedbackKind } from '@/types';

const KIND_LABELS: Record<FeedbackKind, string> = {
  interested: '気になる',
  different: '違う',
  more: 'もっと知りたい',
};

export default function TodayTopicView() {
  const topic = useAppStore((s) => s.topics[0]);
  const clone = useAppStore((s) => s.clone);
  const feedback = useAppStore((s) => s.feedback);
  const pushFeedback = useAppStore((s) => s.pushFeedback);
  const setClone = useAppStore((s) => s.setClone);
  const setViewTab = useAppStore((s) => s.setViewTab);

  const onFeedback = async (kind: FeedbackKind) => {
    if (!topic || !clone) return;
    const fb = { topicId: topic.id, kind, createdAt: nowIso() };
    await storage.saveFeedback(fb);
    pushFeedback(fb);

    let delta = 0;
    if (kind === 'interested') delta = 0.2;
    if (kind === 'more') delta = 0.5;
    if (kind === 'different') delta = -0.1;
    if (delta !== 0) {
      const next = await storage.updateClone({
        syncRate: clamp(clone.syncRate + delta, 80, 100),
      });
      if (next) setClone(next);
    }
  };

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          Generating
        </div>
        <div className="mt-3 text-lg text-white/85">
          今日のTopicを生成中…
        </div>
        <div className="mt-2 text-[12px] text-white/55">
          クローンが書架と思索を辿っています
        </div>
      </div>
    );
  }

  const currentFb = feedback[topic.id]?.kind;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-neon-cyan)]">
          今日のTopic · {topic.dateKey}
        </div>
        <h1 className="neon-text mt-2 text-3xl font-semibold leading-snug tracking-wide">
          {topic.title}
        </h1>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] text-white/55">
          <span className="font-mono uppercase tracking-[0.25em]">
            なぜ持ち帰った？
          </span>
        </div>
        <p className="text-[14px] leading-[1.9] text-white/85">
          {topic.reasoning}
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
          クローンの今日の経路
        </div>
        <div className="relative pl-6">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-white/[0.08]" />
          {topic.explorationPath.map((p, i) => (
            <div key={i} className="relative mb-4 last:mb-0">
              <div
                className="absolute -left-[10px] top-1.5 h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    i % 2 === 0
                      ? 'var(--color-neon-violet)'
                      : 'var(--color-neon-cyan)',
                  boxShadow: `0 0 8px ${
                    i % 2 === 0
                      ? 'var(--color-neon-violet)'
                      : 'var(--color-neon-cyan)'
                  }`,
                }}
              />
              <div className="text-[13px] leading-relaxed text-white/85">
                {p}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
          関連する概念
        </div>
        <div className="flex flex-wrap gap-2">
          {topic.relatedConcepts.map((c) => (
            <span
              key={c}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/80"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {(Object.keys(KIND_LABELS) as FeedbackKind[]).map((k) => (
          <button
            key={k}
            onClick={() => onFeedback(k)}
            className={`flex-1 rounded-2xl border px-4 py-3 text-[13px] transition-colors ${
              currentFb === k
                ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/15 text-[var(--color-neon-cyan)]'
                : 'border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]'
            }`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
        <button
          onClick={() => setViewTab('chat')}
          className="rounded-2xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-5 py-3 text-[13px] font-medium text-[#06060c]"
        >
          クローンに聞いてみる →
        </button>
      </div>
    </div>
  );
}
