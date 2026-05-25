'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getActiveRooms } from '@/components/world/palettes';
import type { Clone, Topic } from '@/types';

export default function TalkButton() {
  const controlMode = useAppStore((s) => s.controlMode);
  const nearestRoomId = useAppStore((s) => s.nearestRoomId);
  const roomConversationId = useAppStore((s) => s.roomConversationId);
  const startRoomChat = useAppStore((s) => s.startRoomChat);
  const clone = useAppStore((s) => s.clone);
  const topics = useAppStore((s) => s.topics);
  const roomResidents = useAppStore((s) => s.roomResidents);
  const activeRooms = useMemo(
    () => getActiveRooms(clone?.likes ?? []),
    [clone?.likes],
  );
  const [loading, setLoading] = useState(false);

  if (roomConversationId) return null;
  if (controlMode !== 'manual' || !nearestRoomId) return null;

  const room = activeRooms.find((r) => r.id === nearestRoomId);
  if (!room) return null;
  const residentName =
    room.roster[roomResidents[room.id] ?? 0] ?? room.avatarName;

  const handleClick = async () => {
    if (loading || !clone) return;
    setLoading(true);
    try {
      const res = await fetch('/api/room-chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clone,
          recentTopics: (topics as Topic[]).slice(0, 7),
          avatarName: residentName,
          roomName: room.name,
          roomTopic: room.topic,
        }),
      });
      if (!res.ok) return;
      const { sessionId, message } = (await res.json()) as {
        sessionId: string;
        message: string;
        avatarName: string;
      };
      startRoomChat(sessionId, room.id, residentName, room.color, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 px-5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 disabled:opacity-60"
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
          {loading ? '準備中…' : `${residentName} と会話する`}
        </div>
      </div>
      <span className="ml-1 text-[14px] text-white/75">›</span>
    </button>
  );
}
