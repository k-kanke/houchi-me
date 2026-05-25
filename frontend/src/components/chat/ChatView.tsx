'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { engine } from '@/lib/clone-engine';
import { nowIso, uuid } from '@/lib/util';

const SUGGESTIONS = [
  'なぜこれに興味を持ったの？',
  '自分のどこと関係ある？',
  'もっと簡単に説明して',
  '最初に何を見ればいい？',
  '他のTopicもある？',
];

export default function ChatView() {
  const clone = useAppStore((s) => s.clone);
  const messages = useAppStore((s) => s.messages);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const updateMessage = useAppStore((s) => s.updateMessage);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [messages]);

  const send = async (raw: string) => {
    const t = raw.trim();
    if (!t || !clone || sending) return;
    setSending(true);
    const userMsg = {
      id: uuid(),
      role: 'user' as const,
      text: t,
      createdAt: nowIso(),
    };
    await storage.appendMessage(userMsg);
    appendMessage(userMsg);
    setText('');

    const cloneMsgId = uuid();
    const placeholder = {
      id: cloneMsgId,
      role: 'clone' as const,
      text: '',
      createdAt: nowIso(),
    };
    appendMessage(placeholder);

    let acc = '';
    for await (const chunk of engine.chatStream(clone, messages, t)) {
      acc += chunk;
      updateMessage(cloneMsgId, acc);
    }
    await storage.appendMessage({ ...placeholder, text: acc });
    setSending(false);
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
            CHAT · {clone?.name}
          </div>
          <div className="mt-1 text-[12px] text-white/65">
            クローンに、なぜそのTopicを持ち帰ったのか聞いてみよう。
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        {messages.length === 0 && (
          <div className="grid place-items-center py-12 text-center text-[12px] text-white/45">
            まだメッセージはありません。下の候補から始めてみよう。
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-[var(--color-neon-violet)]/30 to-[var(--color-neon-cyan)]/20 text-white'
                  : 'border border-white/[0.08] bg-white/[0.03] text-white/90'
              }`}
            >
              {m.text || (
                <span className="text-white/40">
                  <span
                    className="inline-block h-1 w-1 rounded-full bg-white/60"
                    style={{ animation: 'blink 1s ease-in-out infinite' }}
                  />{' '}
                  考え中…
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={sending}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11.5px] text-white/65 hover:bg-white/[0.06] disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="メッセージを入力 · Enter で送信 / Shift+Enter で改行"
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[13.5px] text-white placeholder:text-white/35 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
          disabled={sending}
        />
        <button
          onClick={() => send(text)}
          disabled={sending || !text.trim()}
          className="rounded-xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-4 py-2 text-[12px] font-medium text-[#06060c] disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </div>
  );
}
