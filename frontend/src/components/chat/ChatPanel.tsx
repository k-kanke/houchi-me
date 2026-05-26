'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { engine } from '@/lib/clone-engine';
import { nowIso, uuid } from '@/lib/util';

const SUGGESTIONS = [
  'なぜこれに興味を持ったの？',
  '自分のどこと関係ある？',
  '他のTopicもある？',
];

const FIXED_REPLY_TEXT =
  'API 接続後にチャット機能は利用可能になります。今は静かに待っていてね。';

export default function ChatPanel() {
  const chatPanelOpen = useAppStore((s) => s.chatPanelOpen);
  const setChatPanelOpen = useAppStore((s) => s.setChatPanelOpen);
  const clone = useAppStore((s) => s.clone);
  const messages = useAppStore((s) => s.messages);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const updateMessage = useAppStore((s) => s.updateMessage);
  const chatTrigger = useAppStore((s) => s.chatTrigger);
  const setChatTrigger = useAppStore((s) => s.setChatTrigger);
  const chatTarget = useAppStore((s) => s.chatTarget);
  const setChatTarget = useAppStore((s) => s.setChatTarget);
  const setMessages = useAppStore((s) => s.setMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (raw: string, fixedReply = false) => {
      const t = raw.trim();
      if (!t || !clone || sending) return;
      setSending(true);
      const persistsMessages = engine.persistsMessages === true;
      const userMsg = {
        id: uuid(),
        role: 'user' as const,
        text: t,
        createdAt: nowIso(),
      };
      if (!persistsMessages) {
        await storage.appendMessage(userMsg);
      }
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

      try {
        let acc = '';
        if (fixedReply) {
          for (const ch of FIXED_REPLY_TEXT) {
            acc += ch;
            updateMessage(cloneMsgId, acc);
            await new Promise((r) => setTimeout(r, 24));
          }
        } else {
          for await (const chunk of engine.chatStream(clone, messages, t)) {
            acc += chunk;
            updateMessage(cloneMsgId, acc);
          }
        }
        if (!persistsMessages) {
          await storage.appendMessage({ ...placeholder, text: acc });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        updateMessage(
          cloneMsgId,
          `接続に失敗しました。少し時間をおいてもう一度試してください。(${message})`,
        );
      } finally {
        setSending(false);
      }
    },
    [clone, sending, messages, appendMessage, updateMessage],
  );

  useEffect(() => {
    if (!chatTrigger) return;
    const { message, fixedReply } = chatTrigger;
    setChatTrigger(null);
    setChatPanelOpen(true);
    // 直接呼ぶ。setTimeout(...,0) を挟むと、setChatTrigger(null) によって
    // useEffect の deps が変化 → cleanup で clearTimeout が走り、send が発火しない。
    void send(message, fixedReply);
  }, [chatTrigger, setChatTrigger, setChatPanelOpen, send]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setChatPanelOpen]);

  const panelStyle = {
    background: 'rgba(10, 8, 32, 0.32)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  } as const;

  return (
    <>
      <div
        role="presentation"
        aria-hidden={!chatPanelOpen}
        onClick={() => setChatPanelOpen(false)}
        className={`fixed inset-0 z-30 bg-black/55 transition-opacity duration-300 lg:hidden ${
          chatPanelOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="クローンチャット"
        aria-hidden={!chatPanelOpen}
        className={`fixed inset-y-0 right-0 z-40 flex h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.06] shadow-[-12px_0_40px_rgba(0,0,0,0.45)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.33,1.1,0.68,1)] lg:static lg:z-auto lg:shadow-none ${
          chatPanelOpen
            ? 'w-[min(380px,100vw)] translate-x-0 lg:w-[380px]'
            : 'pointer-events-none w-[min(380px,100vw)] translate-x-full lg:w-0 lg:translate-x-0 lg:border-0'
        }`}
        style={panelStyle}
      >
      <div
        className="flex h-[72px] items-center justify-between border-b border-white/[0.05] px-4"
        style={{
          background: 'rgba(10, 8, 32, 0.32)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-2">
            <div className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] leading-none text-white/88">
              {chatTarget.type === 'self'
                ? (clone?.name ?? 'Clone')
                : chatTarget.name}
            </div>
            <div className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-white/34">
              {chatTarget.type === 'self'
                ? 'your clone'
                : chatTarget.type === 'agent'
                  ? `AI agent · ${chatTarget.topic}`
                  : `human · ${chatTarget.friendId}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {chatTarget.type !== 'self' ? (
            <button
              onClick={() => setChatTarget({ type: 'self' })}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] text-white/55 hover:bg-white/[0.06]"
              title="自分のクローンに戻る"
            >
              自分に戻る
            </button>
          ) : (
            <button
              onClick={async () => {
                if (sending) return;
                if (messages.length > 0) {
                  const ok = window.confirm(
                    '会話履歴を消して新しい会話を始めますか？',
                  );
                  if (!ok) return;
                }
                setMessages([]);
                setText('');
                await storage.clearMessages();
              }}
              disabled={sending}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] text-white/55 hover:bg-white/[0.06] disabled:opacity-40"
              title="会話履歴を消去して新しい会話を始める"
            >
              ＋ 新規
            </button>
          )}
          <button
            type="button"
            onClick={() => setChatPanelOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] lg:hidden"
            aria-label="チャットを閉じる"
            title="チャットを閉じる"
          >
            ×
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="grid place-items-center px-2 pt-16 text-center text-[12px] text-white/40">
            まだメッセージはありません。<br />
            下の候補から始めてみよう。
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
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

      <div className="space-y-2 border-t border-white/[0.05] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={sending}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] text-white/65 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="メッセージを入力..."
            className="flex-1 resize-none bg-transparent px-2 py-1 text-[13px] text-white placeholder:text-white/35 focus:outline-none"
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
            className="rounded-xl bg-gradient-to-r from-[var(--color-neon-violet)] to-[var(--color-neon-cyan)] px-3 py-1.5 text-[11.5px] font-medium text-[#06060c] disabled:opacity-40"
          >
            送信
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
