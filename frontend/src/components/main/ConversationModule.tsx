'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getActiveRooms } from '@/components/world/palettes';

export default function ConversationModule() {
  const roomConversationId = useAppStore((s) => s.roomConversationId);
  const setRoomConversationId = useAppStore((s) => s.setRoomConversationId);
  const convTurnIdx = useAppStore((s) => s.convTurnIdx);
  const clone = useAppStore((s) => s.clone);
  const roomResidents = useAppStore((s) => s.roomResidents);
  const activeRooms = useMemo(
    () => getActiveRooms(clone?.likes ?? []),
    [clone?.likes],
  );

  if (!roomConversationId) return null;
  const room = activeRooms.find((r) => r.id === roomConversationId);
  if (!room) return null;

  const turn = room.dialogue[convTurnIdx];
  if (!turn) return null;

  const residentName =
    room.roster[roomResidents[room.id] ?? 0] ?? room.avatarName;
  const isAgent = turn.speaker === 'agent';
  const speakerName = isAgent ? residentName : clone?.name ?? 'Mira';
  const speakerSub = isAgent
    ? `AI エージェント · ${room.topic}`
    : 'あなたのクローン';
  const speakerColor = isAgent ? room.color : '#a378ff';

  return (
    <div
      className="pointer-events-auto"
      style={{ width: 'min(620px, calc(100% - 2rem))' }}
    >
      <div
        className="rounded-3xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
        style={{
          background: '#0a0820',
          backgroundImage: `linear-gradient(180deg, ${speakerColor}22 0%, transparent 80%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${speakerColor}, #0a0820 80%)`,
                boxShadow: `0 0 20px ${speakerColor}99`,
              }}
            />
            <div className="leading-tight">
              <div className="text-[14px] font-medium text-white">
                {speakerName}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
                {speakerSub}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-[10.5px] text-white/55">
              {convTurnIdx + 1} / {room.dialogue.length}
            </div>
            <button
              onClick={() => setRoomConversationId(null)}
              className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] text-white/85 hover:bg-white/[0.12]"
            >
              終わる
            </button>
          </div>
        </div>

        {/* Dialogue line */}
        <div className="px-6 py-5">
          <div
            className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className="max-w-[88%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed"
              style={{
                background: isAgent
                  ? `${speakerColor}26`
                  : 'linear-gradient(135deg, rgba(163,120,255,0.35), rgba(79,245,231,0.25))',
                border: `1px solid ${speakerColor}55`,
                color: '#ffffff',
              }}
            >
              {turn.line}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-b-3xl bg-white/[0.05]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((convTurnIdx + 1) / room.dialogue.length) * 100}%`,
              background: speakerColor,
              boxShadow: `0 0 10px ${speakerColor}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
