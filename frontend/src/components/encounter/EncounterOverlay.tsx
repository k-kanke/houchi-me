'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

const MAX_TURNS = 3;
const TURN_DELAY_MS = 2500;
const END_DELAY_MS = 4000;

const AVATAR_COLORS: Record<string, string> = {
  Sage: '#f0a030',
  Echo: '#4ff5e7',
};
const DEFAULT_WILD_COLOR = '#a378ff';

export default function EncounterOverlay() {
  const encounter = useAppStore((s) => s.encounter);
  const clone = useAppStore((s) => s.clone);

  const sessionIdRef = useRef<string | null>(null);
  const turnCountRef = useRef(0);
  const runningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const runTurnRef = useRef<((sessionId: string) => Promise<void>) | null>(null);
  runTurnRef.current = async (sessionId: string) => {
    if (runningRef.current || sessionIdRef.current !== sessionId) return;

    const {
      addEncounterMessage,
      appendEncounterStream,
      finalizeEncounterStream,
      endEncounter,
      setEncounterLoading,
    } = useAppStore.getState();

    if (turnCountRef.current >= MAX_TURNS) {
      timerRef.current = setTimeout(async () => {
        await fetch('/api/encounter/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        endEncounter();
      }, END_DELAY_MS);
      return;
    }

    runningRef.current = true;
    setEncounterLoading(true);

    try {
      const res = await fetch('/api/encounter/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok || !res.body) return;

      setEncounterLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let phase: 'clone' | 'wild' | null = null;
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') break;
          try {
            const { phase: p, text } = JSON.parse(raw) as {
              phase: 'clone' | 'wild';
              text: string;
            };
            if (p !== phase) {
              phase = p;
              addEncounterMessage(p === 'clone' ? 'user' : 'model');
            }
            appendEncounterStream(text);
          } catch {
            // ignore malformed SSE
          }
        }
      }

      finalizeEncounterStream();
      turnCountRef.current += 1;
    } finally {
      runningRef.current = false;
    }

    if (sessionIdRef.current !== sessionId) return;
    timerRef.current = setTimeout(
      () => runTurnRef.current?.(sessionId),
      TURN_DELAY_MS,
    );
  };

  useEffect(() => {
    if (!encounter?.sessionId) {
      sessionIdRef.current = null;
      turnCountRef.current = 0;
      runningRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    sessionIdRef.current = encounter.sessionId;
    turnCountRef.current = 0;

    timerRef.current = setTimeout(
      () => runTurnRef.current?.(encounter.sessionId),
      TURN_DELAY_MS,
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [encounter?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnd = async () => {
    if (!encounter) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionIdRef.current = null;
    await fetch('/api/encounter/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: encounter.sessionId }),
    });
    useAppStore.getState().endEncounter();
  };

  if (!encounter) return null;

  const wildColor = AVATAR_COLORS[encounter.avatarName] ?? DEFAULT_WILD_COLOR;
  const cloneColor = '#a378ff';
  const cloneName = clone?.name ?? 'クローン';

  return (
    <div className="pointer-events-auto" style={{ width: 'min(440px, calc(100% - 2rem))' }}>
      <div
        className="rounded-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        style={{
          background: '#0a0820',
          backgroundImage: `linear-gradient(180deg, ${wildColor}18 0%, transparent 70%)`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 flex-shrink-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${wildColor}, #0a0820 80%)`,
                boxShadow: `0 0 10px ${wildColor}88`,
              }}
            />
            <div className="leading-tight">
              <div className="text-[12px] font-medium text-white/90">
                {encounter.avatarName}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                エンカウント中
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {encounter.isLoading && (
              <span className="animate-pulse font-mono text-[9.5px] text-white/40">
                考え中…
              </span>
            )}
            <button
              onClick={handleEnd}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-white/70 transition-colors hover:bg-white/[0.08]"
            >
              退席
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="scrollbar-thin flex max-h-[20vh] min-h-[4rem] flex-col gap-2 overflow-y-auto px-3.5 py-3"
        >
          {encounter.messages.map((msg, i) => {
            const isWild = msg.role === 'model';
            const speakerName = isWild ? encounter.avatarName : cloneName;
            const color = isWild ? wildColor : cloneColor;

            return (
              <div key={i} className={`flex ${isWild ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[84%] space-y-0.5">
                  <div
                    className={`font-mono text-[8.5px] uppercase tracking-[0.18em] ${isWild ? 'text-left' : 'text-right'}`}
                    style={{ color: `${color}aa` }}
                  >
                    {speakerName}
                  </div>
                  <div
                    className="rounded-xl px-3 py-2 text-[12px] leading-relaxed text-white"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}35`,
                    }}
                  >
                    {msg.content || (
                      <span className="animate-pulse text-white/30">…</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-[2px] w-full overflow-hidden rounded-b-2xl bg-white/[0.04]">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${(turnCountRef.current / MAX_TURNS) * 100}%`,
              background: wildColor,
              boxShadow: `0 0 6px ${wildColor}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
