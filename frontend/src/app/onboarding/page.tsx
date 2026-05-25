'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { storage } from '@/lib/storage';
import { useAppStore } from '@/lib/store';
import { nowIso, uuid } from '@/lib/util';
import type { Clone, ExplorationType, PersonalityShift } from '@/types';

const MBTI = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const SHIFTS: { id: PersonalityShift; label: string; desc: string }[] = [
  { id: 'stay', label: '今のままの自分', desc: '本人と同じ性向で探索する' },
  { id: 'outgoing', label: '少し外向的', desc: '人との接点を増やしてくれる' },
  { id: 'adventurous', label: '少し冒険的', desc: '未知の書架へ踏み込みやすい' },
  { id: 'craft', label: '少し職人気質', desc: '同じ領域を深く掘る' },
  { id: 'creative', label: '少しクリエイティブ', desc: '異領域を結びつける' },
  { id: 'social', label: '少し社交的', desc: '対話から興味を発見する' },
  { id: 'stoic', label: '少しストイック', desc: '一人で長く集中する' },
];

const EXPLORATIONS: { id: ExplorationType; label: string; desc: string }[] = [
  { id: 'depth', label: '深掘り型', desc: '一つを深く掘る · 研究気質' },
  { id: 'breadth', label: '拡散型', desc: '複数を横断する · 偶然の出会い' },
  { id: 'social', label: '社交型', desc: '人とのつながりから発見' },
  { id: 'reverse', label: '反転型', desc: '本人と真逆の方向で探索' },
];

const LIKE_SUGGESTIONS = [
  'カフェ',
  '韓ドラ',
  '旅行',
  '読書',
  '映画',
  '音楽',
  'ゲーム',
  '料理',
  '写真',
  'アニメ',
  'スポーツ',
  'ファッション',
  '推し活',
  '散歩',
  '猫',
] as const;

const DISLIKE_SUGGESTIONS = [
  '人混み',
  '早起き',
  '大音量',
  '湿気',
  '待ち時間',
  '終電',
  '虫',
  '辛い食べ物',
  'プレゼン',
  '夜更かし',
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const setClone = useAppStore((s) => s.setClone);
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [mbti, setMbti] = useState('ENFP');
  const [likes, setLikes] = useState<string[]>([]);
  const [likeInput, setLikeInput] = useState('');
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [dislikeInput, setDislikeInput] = useState('');
  const [selfDescription, setSelfDescription] = useState(
    '人と話すのは好きだけど、一人で没頭できる趣味も欲しい。好きなことはあるけど、それが「本気の興味」かはまだわからない。',
  );
  const [idealSelf, setIdealSelf] = useState(
    'もっと自分の世界を持っていて、小さな発見を大切にできる人になりたい。',
  );
  const [shift, setShift] = useState<PersonalityShift>('stay');
  const [exploration, setExploration] = useState<ExplorationType>('breadth');

  const canNext =
    (step === 0 && name.trim() && mbti) ||
    (step === 1 && likes.length > 0) ||
    (step === 2 && selfDescription.trim().length > 0) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  const totalSteps = 6;

  const handleSubmit = async () => {
    const clone: Clone = {
      id: uuid(),
      name: name.trim(),
      mbti,
      likes,
      dislikes,
      selfDescription: selfDescription.trim(),
      idealSelf: idealSelf.trim(),
      personalityShift: shift,
      explorationType: exploration,
      syncRate: 99.6,
      createdAt: nowIso(),
    };
    await storage.saveClone(clone);
    setClone(clone);
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto overscroll-y-contain">
      <div className="flex min-h-full items-center justify-center px-4 py-8 sm:py-12">
        <div className="glass-strong relative my-4 w-full max-w-2xl rounded-3xl p-8 md:p-10">
        {/* progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)]'
                  : i < step
                  ? 'w-2 bg-[var(--color-neon-cyan)]/60'
                  : 'w-2 bg-white/15'
              }`}
            />
          ))}
        </div>

        <div className="mb-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
            CLONE FORGE · STEP {step + 1} / {totalSteps}
          </div>
          <h1 className="neon-text mt-2 text-2xl font-semibold tracking-wide">
            {step === 0 && 'クローンを召喚する'}
            {step === 1 && '好きなもの・苦手なもの'}
            {step === 2 && 'あなた自身のこと'}
            {step === 3 && '“もう一人の自分”の性格'}
            {step === 4 && '探索のスタイル'}
            {step === 5 && '召喚の確認'}
          </h1>
        </div>

        <div className="min-h-[260px]">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="クローンの名前">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：Mira"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white placeholder:text-white/30 focus:border-[var(--color-neon-cyan)] focus:outline-none"
                />
              </Field>
              <Field label="MBTI">
                <select
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white focus:border-[var(--color-neon-cyan)] focus:outline-none"
                >
                  {MBTI.map((m) => (
                    <option key={m} value={m} className="bg-[#0a0820]">
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <TagInput
                label="好きなもの"
                placeholder="例：カフェ、韓ドラ、旅行"
                tags={likes}
                input={likeInput}
                setInput={setLikeInput}
                setTags={setLikes}
                suggestions={LIKE_SUGGESTIONS}
                color="var(--color-neon-cyan)"
              />
              <TagInput
                label="苦手なもの（任意）"
                placeholder="例：人混み、早起き"
                tags={dislikes}
                input={dislikeInput}
                setInput={setDislikeInput}
                setTags={setDislikes}
                suggestions={DISLIKE_SUGGESTIONS}
                color="var(--color-neon-pink)"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="自分の説明">
                <textarea
                  value={selfDescription}
                  onChange={(e) => setSelfDescription(e.target.value)}
                  rows={3}
                  placeholder="例：人と話すのは好きだけど、一人で没頭できる趣味も欲しい"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white placeholder:text-white/30 focus:border-[var(--color-neon-cyan)] focus:outline-none"
                />
              </Field>
              <Field label="なりたい自分（任意）">
                <textarea
                  value={idealSelf}
                  onChange={(e) => setIdealSelf(e.target.value)}
                  rows={3}
                  placeholder="例：もっと自分の世界を持っている人になりたい"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white placeholder:text-white/30 focus:border-[var(--color-neon-cyan)] focus:outline-none"
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SHIFTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShift(s.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    shift === s.id
                      ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-[13.5px] font-medium text-white">
                    {s.label}
                  </div>
                  <div className="mt-1 text-[11.5px] text-white/55">
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXPLORATIONS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setExploration(e.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    exploration === e.id
                      ? 'border-[var(--color-neon-violet)] bg-[var(--color-neon-violet)]/12'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-[14px] font-medium text-white">
                    {e.label}
                  </div>
                  <div className="mt-1 text-[12px] text-white/55">{e.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[12.5px]">
              <Row k="クローン名" v={name} />
              <Row k="MBTI" v={mbti} />
              <Row k="好きなもの" v={likes.join('、') || '—'} />
              <Row k="苦手なもの" v={dislikes.join('、') || '—'} />
              <Row k="自分の説明" v={selfDescription || '—'} multi />
              <Row k="なりたい自分" v={idealSelf || '—'} multi />
              <Row
                k="性格シフト"
                v={SHIFTS.find((s) => s.id === shift)?.label ?? ''}
              />
              <Row
                k="探索タイプ"
                v={EXPLORATIONS.find((e) => e.id === exploration)?.label ?? ''}
              />
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-white/70 disabled:opacity-30"
          >
            ← 戻る
          </button>
          {step < totalSteps - 1 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
              className="rounded-full bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-5 py-2 text-[12px] font-medium text-[#06060c] disabled:opacity-40"
            >
              次へ →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-full bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-pink)] px-5 py-2 text-[12px] font-medium text-white shadow-[0_0_20px_rgba(163,120,255,0.5)]"
            >
              クローンを召喚する ✦
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, multi }: { k: string; v: string; multi?: boolean }) {
  return (
    <div
      className={`flex ${
        multi ? 'flex-col gap-1' : 'items-baseline justify-between gap-3'
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
        {k}
      </div>
      <div className="text-white/85">{v}</div>
    </div>
  );
}

function TagInput({
  label,
  placeholder,
  tags,
  input,
  setInput,
  setTags,
  suggestions,
  color,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  input: string;
  setInput: (s: string) => void;
  setTags: (t: string[]) => void;
  suggestions: readonly string[];
  color: string;
}) {
  const commitTag = () => {
    const value = input.trim().replace(/,$/, '');
    if (!value) return;
    if (!tags.includes(value)) {
      setTags([...tags, value]);
    }
    setInput('');
  };

  const toggleSuggestion = (suggestion: string) => {
    if (tags.includes(suggestion)) {
      setTags(tags.filter((x) => x !== suggestion));
    } else {
      setTags([...tags, suggestion]);
    }
  };

  return (
    <Field label={label}>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px]"
              style={{ borderColor: color, color }}
            >
              {t}
              <button
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="text-white/55 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mb-2.5">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
            よく選ばれる候補
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => {
              const selected = tags.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSuggestion(s)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                    selected
                      ? 'bg-white/[0.08] text-white'
                      : 'border-white/12 bg-white/[0.02] text-white/60 hover:border-white/25 hover:bg-white/[0.05] hover:text-white/85'
                  }`}
                  style={
                    selected
                      ? { borderColor: color, color }
                      : undefined
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-white/10 pt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
              自由入力
            </span>
            <span className="text-[10px] text-white/35">Enter で追加</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus-within:border-[var(--tag-accent)] focus-within:ring-1 focus-within:ring-[var(--tag-accent)]/40"
            style={{ ['--tag-accent' as string]: color }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              aria-label={`${label}を入力`}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  commitTag();
                }
              }}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitTag}
              disabled={!input.trim()}
              className="shrink-0 rounded-lg border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/90 transition-colors hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/35"
              style={input.trim() ? { borderColor: color, color } : undefined}
            >
              追加
            </button>
          </div>
        </div>
      </div>
    </Field>
  );
}
