'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getActiveRooms } from '@/components/world/palettes';

export default function TalkButton() {
  const controlMode = useAppStore((s) => s.controlMode);
  const nearestRoomId = useAppStore((s) => s.nearestRoomId);
  const roomConversationId = useAppStore((s) => s.roomConversationId);
  const setRoomConversationId = useAppStore((s) => s.setRoomConversationId);
  const clone = useAppStore((s) => s.clone);
  const roomResidents = useAppStore((s) => s.roomResidents);
  const activeRooms = useMemo(
    () => getActiveRooms(clone?.likes ?? []),
    [clone?.likes],
  );

  // 会話中は何も表示しない（ConversationModule に統合済み）
  if (roomConversationId) return null;

  if (controlMode !== 'manual' || !nearestRoomId) return null;

  const room = activeRooms.find((r) => r.id === nearestRoomId);
  if (!room) return null;
  const residentName =
    room.roster[roomResidents[room.id] ?? 0] ?? room.avatarName;

  const handleClick = () => {
    setRoomConversationId(room.id);
  };

  return (
    <button
      onClick={handleClick}
      className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 px-5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-transform hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${room.color}, rgba(12, 10, 26, 0.85))`,
        backdropFilter: 'blur(18px) saturate(160%)',
      }}
    >
      <div
        className="h-7 w-7 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${room.color}, #0a0820 80%)`,
          boxShadow: `0 0 16px ${room.color}`,
        }}
      />
      <div className="text-left leading-tight">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-white/65">
          {room.name}
        </div>
        <div className="text-[13px] font-medium text-white">
          {residentName} と会話する
        </div>
      </div>
      <span className="ml-1 text-[14px] text-white/75">›</span>
    </button>
  );
}
