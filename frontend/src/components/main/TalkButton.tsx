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
      className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/[0.08] px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.38)] transition-colors hover:border-[#caa85e]/22 hover:bg-white/[0.05] disabled:opacity-60"
      style={{
        background: 'rgba(12, 10, 26, 0.72)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
      }}
    >
      <div className="text-left leading-tight">
        <div className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/34">
          {room.name}
        </div>
        <div className="text-[12px] font-medium text-white/88">
          {loading ? '準備中…' : `${residentName} と会話する`}
        </div>
      </div>
      <span className="ml-0.5 font-mono text-[12px] text-[#f3dfb0]/72">›</span>
    </button>
  );
}
