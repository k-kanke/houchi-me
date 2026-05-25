'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { engine } from '@/lib/clone-engine';
import type { DailyAnswerInput, EncounterLog, HumanFriend } from '@/types';

interface HobbyEntry {
  name: string;
  reason: string;
}

const MOCK_PAST_HOBBIES: HobbyEntry[] = [
  {
    name: '部活（バスケ）',
    reason:
      'チームで一つの動きを作る瞬間が好きだった。誰かのカットに合わせてパスを出せたときの、無言の理解が成立した感覚に強く惹かれていた。',
  },
  {
    name: '原神',
    reason:
      'マップを歩いて未踏のエリアを開く快感と、キャラクター同士の掛け合いの軽さに没頭した。物語が常に “次の地平” を提示してくれるのが心地よかった。',
  },
  {
    name: 'プログラミング言語のホッピング',
    reason:
      '新しい言語の構文と思想に触れるたび、世界の切り取り方が増える気がした。完成度より「新しい目線」を集めること自体が目的化していた時期。',
  },
  {
    name: '深夜ラジオ',
    reason:
      '誰かの独り言が、深夜の自分の独り言と重なる瞬間にホッとした。眠る前の数十分、世界の輪郭が少し柔らかくなる時間として機能していた。',
  },
  {
    name: '麻雀',
    reason:
      '不完全情報の中で確率と読みを編んでいく感覚が好きだった。勝ち負けより、卓を囲むこと自体が一つの小さな物語だった。',
  },
];

function reasonForCurrentLike(name: string, cloneName: string): string {
  return `${cloneName} は「${name}」になぜ惹かれているのか、まだ完全には言葉にできていません。空間・時間・物語・人との接点 — どの軸で接続しているのかを、これから一緒に深掘りしていけます。`;
}

interface OverlayShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}

function OverlayShell({ title, subtitle, children, onClose }: OverlayShellProps) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center px-6 py-6"
      onClick={onClose}
      style={{ background: 'rgba(3, 4, 15, 0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-xl flex-col rounded-3xl border border-white/[0.08] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{
          maxHeight: 'calc(100vh - 3rem)',
          background:
            'linear-gradient(180deg, rgba(22, 18, 43, 0.78), rgba(12, 10, 26, 0.78))',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        }}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-white/[0.05] px-6 py-4">
          <div>
            <div className="text-[15px] font-semibold text-white/95">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-[11.5px] text-white/50">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/[0.08] hover:text-white"
          >
            閉じる ✕
          </button>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hobbies
// ─────────────────────────────────────────────────────────────

function HobbySection({
  title,
  caption,
  items,
  accent,
  onSelect,
}: {
  title: string;
  caption: string;
  items: HobbyEntry[];
  accent: 'cyan' | 'muted';
  onSelect: (entry: HobbyEntry) => void;
}) {
  const accentClass =
    accent === 'cyan'
      ? 'border-[var(--color-neon-cyan)]/30 bg-[var(--color-neon-cyan)]/10 text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]/20'
      : 'border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]';

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <div className="text-[13px] font-semibold text-white/90">{title}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
          {items.length} 件
        </div>
      </div>
      <div className="mb-3 text-[11px] text-white/45">{caption}</div>
      {items.length === 0 ? (
        <div className="text-[12px] text-white/40">まだ登録されていません。</div>
      ) : (
        <div className="scrollbar-thin max-h-44 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-1.5">
            {items.map((entry) => (
              <button
                key={entry.name}
                onClick={() => onSelect(entry)}
                className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${accentClass}`}
              >
                {entry.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function HobbyDetail({
  hobby,
  onBack,
  onTalk,
}: {
  hobby: HobbyEntry;
  onBack: () => void;
  onTalk: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/65 hover:bg-white/[0.06]"
      >
        ← 一覧に戻る
      </button>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          Hobby
        </div>
        <div className="mt-1 text-[16px] font-semibold text-white/95">{hobby.name}</div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          なぜハマっていたのか
        </div>
        <div className="text-[12.5px] leading-relaxed text-white/85">{hobby.reason}</div>
      </div>

      <button
        onClick={onTalk}
        className="w-full rounded-2xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-4 py-3 text-[13px] font-medium text-[#06060c] transition-opacity hover:opacity-90"
      >
        この趣味についてクローンと話す
      </button>
    </div>
  );
}

function HobbiesOverlay({ onClose }: { onClose: () => void }) {
  const clone = useAppStore((s) => s.clone);
  const setChatTrigger = useAppStore((s) => s.setChatTrigger);
  const setChatTarget = useAppStore((s) => s.setChatTarget);
  const [selected, setSelected] = useState<HobbyEntry | null>(null);

  const cloneName = clone?.name ?? 'クローン';
  const currentHobbies: HobbyEntry[] = (clone?.likes ?? []).map((name) => ({
    name,
    reason: reasonForCurrentLike(name, cloneName),
  }));

  const talkAbout = (hobby: HobbyEntry) => {
    setChatTarget({ type: 'self' });
    setChatTrigger({
      message: `「${hobby.name}」って、なんで好きになったのか教えてほしい。`,
      fixedReply: false,
    });
    setSelected(null);
    onClose();
  };

  return (
    <OverlayShell
      title="ハマっている趣味"
      subtitle={
        selected
          ? selected.name
          : 'タップすると、なぜハマっていたかが見られます'
      }
      onClose={onClose}
    >
      {selected ? (
        <HobbyDetail
          hobby={selected}
          onBack={() => setSelected(null)}
          onTalk={() => talkAbout(selected)}
        />
      ) : (
        <div className="space-y-3">
          <HobbySection
            title="今ハマっているもの"
            caption="現在クローンが関心を向けているテーマ"
            items={currentHobbies}
            accent="cyan"
            onSelect={setSelected}
          />
          <HobbySection
            title="昔ハマっていたもの"
            caption="今は離れたが、過去に深く触れていたテーマ"
            items={MOCK_PAST_HOBBIES}
            accent="muted"
            onSelect={setSelected}
          />
        </div>
      )}
    </OverlayShell>
  );
}

function EncounterLogsOverlay({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<EncounterLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await storage.getEncounterLogs();
        if (!cancelled) setLogs(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <OverlayShell
      title="会話ログ"
      subtitle="クローンが最近エージェントと交わした会話"
      onClose={onClose}
    >
      {loading ? (
        <div className="text-[12px] text-white/45">読み込み中...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-4 text-[12px] text-white/40">
          まだ会話ログはありません。
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <section
              key={log.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-white/90">
                    {log.partnerName} · {log.location}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/45">
                    {new Date(log.createdAt).toLocaleString('ja-JP')}
                    {log.isMock ? ' · mock' : ''}
                  </div>
                </div>
                {log.crossTopic && (
                  <div className="rounded-full border border-[var(--color-neon-cyan)]/25 bg-[var(--color-neon-cyan)]/10 px-2.5 py-1 text-[10.5px] text-[var(--color-neon-cyan)]">
                    {log.crossTopic}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {log.dialogue.map((line, index) => (
                  <div
                    key={`${log.id}-${index}`}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 py-2"
                  >
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                      {line.speaker}
                    </div>
                    <div className="text-[12.5px] leading-relaxed text-white/85">
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </OverlayShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Daily questions
// ─────────────────────────────────────────────────────────────

const DAILY_QUESTIONS: Array<{
  key: string;
  text: string;
  placeholder: string;
}> = [
  {
    key: 'energy-source',
    text: '最近、自然と時間を使ってしまったものは何？',
    placeholder: '例: 気づいたら動画編集の作例を見ていた',
  },
  {
    key: 'social-comfort',
    text: '今は人と話したい気分？それとも一人で深掘りしたい？',
    placeholder: '例: 今日は一人で考えたいけど、少人数なら話したい',
  },
  {
    key: 'new-curiosity',
    text: '最近少しでも気になったけど、まだ触れていないものは？',
    placeholder: '例: フィールド録音、建築写真、短歌',
  },
  {
    key: 'avoid-today',
    text: '今日は避けたいもの、気が進まないものは？',
    placeholder: '例: 人が多い場所、急ぎの予定、長い文章',
  },
  {
    key: 'future-self',
    text: '明日の自分に少しだけ近づくなら、何を試したい？',
    placeholder: '例: 朝に10分だけメモを書く',
  },
];

function DailyQuestionsOverlay({ onClose }: { onClose: () => void }) {
  const clone = useAppStore((s) => s.clone);
  const setClone = useAppStore((s) => s.setClone);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  if (!clone) return null;

  const answeredCount = DAILY_QUESTIONS.filter((question) =>
    answers[question.key]?.trim(),
  ).length;
  const canSubmit = answeredCount >= 3 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    const payload: DailyAnswerInput[] = DAILY_QUESTIONS.map((question) => ({
      questionKey: question.key,
      answer: answers[question.key]?.trim() ?? '',
    })).filter((answer) => answer.answer);

    setSubmitting(true);
    setError(null);
    setSummary(null);

    try {
      const result = await engine.applyDailyAnswers(clone, payload);
      const nextClone = {
        ...clone,
        syncRate: result.syncRate,
        vitals: result.vitals,
        explorationType: result.explorationType,
        personalityShift: result.personalityShift,
      };
      setClone(nextClone);
      setSummary(result.summary);
      try {
        await storage.updateClone({
          syncRate: result.syncRate,
          vitals: result.vitals,
          explorationType: result.explorationType,
          personalityShift: result.personalityShift,
        });
      } catch (persistError) {
        console.warn('Failed to persist daily answer result locally:', persistError);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OverlayShell
      title="毎日の質問"
      subtitle={`${clone.name} の同期データ`}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              Sync
            </div>
            <div className="mt-1 text-[13px] text-[var(--color-neon-cyan)]">
              {clone.syncRate.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              Answered
            </div>
            <div className="mt-1 text-[13px] text-white/85">
              {answeredCount}/{DAILY_QUESTIONS.length}
            </div>
          </div>
        </div>

        {DAILY_QUESTIONS.map((question, index) => (
          <label
            key={question.key}
            className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="mb-2 flex items-start gap-2">
              <span className="font-mono text-[10px] text-[var(--color-neon-cyan)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-[12.5px] leading-relaxed text-white/85">
                {question.text}
              </span>
            </div>
            <textarea
              value={answers[question.key] ?? ''}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [question.key]: event.target.value,
                }))
              }
              rows={2}
              placeholder={question.placeholder}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12.5px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
            />
          </label>
        ))}

        {error && (
          <div className="rounded-xl border border-[var(--color-neon-pink)]/40 bg-[var(--color-neon-pink)]/10 px-3 py-2 text-[12px] text-[var(--color-neon-pink)]">
            {error}
          </div>
        )}

        {summary && (
          <div className="rounded-2xl border border-[var(--color-neon-green)]/30 bg-[var(--color-neon-green)]/10 p-3 text-[12.5px] leading-relaxed text-white/85">
            {summary}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-4 py-3 text-[13px] font-medium text-[#06060c] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? '同期中…' : '回答を送信'}
        </button>
      </div>
    </OverlayShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Friends（人間のみ）
// ─────────────────────────────────────────────────────────────

function HumanDetail({
  friend,
  onBack,
  onTalk,
}: {
  friend: HumanFriend;
  onBack: () => void;
  onTalk: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/65 hover:bg-white/[0.06]"
      >
        ← 一覧に戻る
      </button>

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-pink)]" />
        <div>
          <div className="text-[14px] text-white/95">{friend.name}</div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/40">
            {friend.friendId}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
          自己紹介
        </div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-white/80">
          {friend.bio}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
            追加日
          </div>
          <div className="mt-1 text-[12.5px] text-white/85">{friend.addedAt}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
            種別
          </div>
          <div className="mt-1 text-[12.5px] text-white/85">人間ユーザー</div>
        </div>
      </div>

      <button
        onClick={onTalk}
        className="w-full rounded-2xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-4 py-3 text-[13px] font-medium text-[#06060c] hover:opacity-90"
      >
        話しかける
      </button>
    </div>
  );
}

function AddFriendForm() {
  const addHumanFriend = useAppStore((s) => s.addHumanFriend);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = () => {
    const res = addHumanFriend(value);
    setFeedback(res);
    if (res.ok) setValue('');
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
        フレンド ID で追加
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFeedback(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="例: ABCD-1234"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[12.5px] uppercase tracking-[0.15em] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="rounded-xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-4 py-2 text-[12px] font-medium text-[#06060c] disabled:opacity-40"
        >
          追加
        </button>
      </div>
      {feedback && (
        <div
          className={`mt-2 text-[11px] ${
            feedback.ok ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-pink)]'
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}

function MyFriendIdCard() {
  const myFriendId = useAppStore((s) => s.myFriendId);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(myFriendId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-neon-violet)]/30 bg-gradient-to-br from-[var(--color-neon-violet)]/10 to-[var(--color-neon-cyan)]/5 p-4">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-white/55">
        Your friend ID
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="font-mono text-[18px] tracking-[0.2em] text-white/95">
          {myFriendId}
        </div>
        <button
          onClick={copy}
          className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[11px] text-white/75 hover:bg-white/[0.1]"
        >
          {copied ? '✓ コピー済み' : 'コピー'}
        </button>
      </div>
      <div className="mt-2 text-[10.5px] text-white/45">
        この ID を友達に渡すと、フレンドとして追加してもらえます
      </div>
    </div>
  );
}

function FriendsOverlay({ onClose }: { onClose: () => void }) {
  const humanFriends = useAppStore((s) => s.humanFriends);
  const setChatTarget = useAppStore((s) => s.setChatTarget);
  const [selected, setSelected] = useState<HumanFriend | null>(null);

  const talkToHuman = (friend: HumanFriend) => {
    setChatTarget({
      type: 'human',
      id: friend.id,
      name: friend.name,
      friendId: friend.friendId,
    });
    setSelected(null);
    onClose();
  };

  if (selected) {
    return (
      <OverlayShell title="フレンド" subtitle={selected.name} onClose={onClose}>
        <HumanDetail
          friend={selected}
          onBack={() => setSelected(null)}
          onTalk={() => talkToHuman(selected)}
        />
      </OverlayShell>
    );
  }

  return (
    <OverlayShell
      title="フレンド"
      subtitle="フレンド ID で追加して、人間同士で話そう"
      onClose={onClose}
    >
      <div className="space-y-3">
        <MyFriendIdCard />
        <AddFriendForm />
        <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/45">
          追加済みフレンド ({humanFriends.length})
        </div>
        {humanFriends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-4 text-center text-[11.5px] text-white/40">
            まだフレンドがいません。<br />ID を入力して追加してください。
          </div>
        ) : (
          humanFriends.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(f)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-pink)]" />
              <div className="flex-1">
                <div className="text-[13px] text-white/90">{f.name}</div>
                <div className="font-mono text-[10px] tracking-[0.15em] text-white/45">
                  {f.friendId}
                </div>
              </div>
              <span className="text-[14px] text-white/40">›</span>
            </button>
          ))
        )}
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-3 text-center text-[10.5px] text-white/40">
          BE 接続後、ID 検索 / 招待 / 双方向承認 のフローを実装予定
        </div>
      </div>
    </OverlayShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile（自分）
// ─────────────────────────────────────────────────────────────

function ChipEditor({
  label,
  caption,
  items,
  onChange,
  accent,
}: {
  label: string;
  caption: string;
  items: string[];
  onChange: (next: string[]) => void;
  accent: 'cyan' | 'muted';
}) {
  const [draft, setDraft] = useState('');
  const accentClass =
    accent === 'cyan'
      ? 'border-[var(--color-neon-cyan)]/30 bg-[var(--color-neon-cyan)]/10 text-[var(--color-neon-cyan)]'
      : 'border-white/10 bg-white/[0.03] text-white/75';

  const add = () => {
    const t = draft.trim();
    if (!t || items.includes(t)) {
      setDraft('');
      return;
    }
    onChange([...items, t]);
    setDraft('');
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
        {label}
      </div>
      <div className="mb-2 text-[11px] text-white/45">{caption}</div>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {items.map((tag, idx) => (
            <span
              key={tag}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] ${accentClass}`}
            >
              {tag}
              <button
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="text-white/60 hover:text-white"
                title="削除"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="追加するキーワード"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="rounded-xl bg-white/[0.08] px-3 py-1.5 text-[12px] text-white/85 hover:bg-white/[0.14] disabled:opacity-40"
        >
          追加
        </button>
      </div>
    </div>
  );
}

function ProfileViewMode({
  rows,
  clone,
  onEdit,
}: {
  rows: { label: string; value: string }[];
  clone: NonNullable<ReturnType<typeof useAppStore.getState>['clone']>;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)]" />
        <div>
          <div className="text-[14px] text-white/95">{clone.name}</div>
          <div className="text-[11.5px] text-white/55">
            {clone.mbti} · 同期率 {(clone.syncRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              {r.label}
            </div>
            <div className="mt-1 text-[12.5px] text-white/85">{r.value}</div>
          </div>
        ))}
      </div>

      {clone.likes.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
            好きなもの
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {clone.likes.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--color-neon-cyan)]/30 bg-[var(--color-neon-cyan)]/10 px-3 py-1 text-[12px] text-[var(--color-neon-cyan)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {clone.dislikes.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
            苦手なもの
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {clone.dislikes.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/65"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
          自己紹介
        </div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-white/80">
          {clone.selfDescription || '（未入力）'}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
          なりたい自分
        </div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-white/80">
          {clone.idealSelf || '（未入力）'}
        </div>
      </div>

      <button
        onClick={onEdit}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[12px] text-white/85 hover:bg-white/[0.08]"
      >
        プロフィールを編集
      </button>
    </div>
  );
}

function ProfileOverlay({ onClose }: { onClose: () => void }) {
  const clone = useAppStore((s) => s.clone);
  const setClone = useAppStore((s) => s.setClone);
  const myFriendId = useAppStore((s) => s.myFriendId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [mbti, setMbti] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [selfDescription, setSelfDescription] = useState('');
  const [idealSelf, setIdealSelf] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 編集モードに入るたびに現在値で初期化
  useEffect(() => {
    if (!editing || !clone) return;
    const timer = window.setTimeout(() => {
      setName(clone.name);
      setMbti(clone.mbti);
      setLikes([...clone.likes]);
      setDislikes([...clone.dislikes]);
      setSelfDescription(clone.selfDescription);
      setIdealSelf(clone.idealSelf);
      setError(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editing, clone]);

  if (!clone) return null;

  const rows: { label: string; value: string }[] = [
    { label: 'クローン名', value: clone.name },
    { label: 'MBTI', value: clone.mbti || '—' },
    { label: '同期率', value: `${(clone.syncRate * 100).toFixed(1)}%` },
    { label: '探索タイプ', value: clone.explorationType },
    { label: '性格シフト', value: clone.personalityShift },
    { label: 'フレンド ID', value: myFriendId },
  ];

  const save = async () => {
    if (!name.trim()) {
      setError('クローン名は必須です');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await storage.updateClone({
        name: name.trim(),
        mbti: mbti.trim(),
        likes,
        dislikes,
        selfDescription: selfDescription.trim(),
        idealSelf: idealSelf.trim(),
      });
      if (updated) {
        setClone(updated);
        setEditing(false);
      } else {
        setError('保存に失敗しました');
      }
    } catch (e) {
      setError((e as Error).message || '保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OverlayShell
      title="プロフィール"
      subtitle={editing ? '編集中' : `${clone.name} の人格データ`}
      onClose={onClose}
    >
      {!editing ? (
        <ProfileViewMode rows={rows} clone={clone} onEdit={() => setEditing(true)} />
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              クローン名
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
            />
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              MBTI
            </div>
            <input
              value={mbti}
              onChange={(e) => setMbti(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="例: INFJ"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[13px] tracking-[0.15em] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
            />
          </div>

          <ChipEditor
            label="好きなもの"
            caption="この項目が部屋の出現条件にも使われます"
            items={likes}
            onChange={setLikes}
            accent="cyan"
          />

          <ChipEditor
            label="苦手なもの"
            caption="クローンの行動バイアスに使われます"
            items={dislikes}
            onChange={setDislikes}
            accent="muted"
          />

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              自己紹介
            </div>
            <textarea
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] leading-relaxed text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
            />
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/40">
              なりたい自分
            </div>
            <textarea
              value={idealSelf}
              onChange={(e) => setIdealSelf(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] leading-relaxed text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]/30"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[var(--color-neon-pink)]/40 bg-[var(--color-neon-pink)]/10 px-3 py-2 text-[12px] text-[var(--color-neon-pink)]">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[12px] text-white/70 hover:bg-white/[0.06] disabled:opacity-40"
            >
              キャンセル
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] py-2 text-[12.5px] font-medium text-[#06060c] disabled:opacity-40"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      )}
    </OverlayShell>
  );
}

// ─────────────────────────────────────────────────────────────

export default function Overlays() {
  const openOverlay = useAppStore((s) => s.openOverlay);
  const setOpenOverlay = useAppStore((s) => s.setOpenOverlay);

  useEffect(() => {
    if (!openOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOverlay(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openOverlay, setOpenOverlay]);

  const close = () => setOpenOverlay(null);

  if (!openOverlay) return null;
  if (openOverlay === 'hobbies') return <HobbiesOverlay onClose={close} />;
  if (openOverlay === 'encounters') return <EncounterLogsOverlay onClose={close} />;
  if (openOverlay === 'daily') return <DailyQuestionsOverlay onClose={close} />;
  if (openOverlay === 'friends') return <FriendsOverlay onClose={close} />;
  if (openOverlay === 'profile') return <ProfileOverlay onClose={close} />;
  return null;
}
