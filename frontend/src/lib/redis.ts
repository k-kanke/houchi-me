import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export const ENCOUNTER_TTL = 60 * 30; // 30分
export const ROOM_CHAT_TTL = 60 * 30; // 30分

export interface EncounterSession {
  cloneId: string;
  cloneName: string;
  avatarName: string;
  avatarSystemInstruction: string;
  cloneContext: string;
  history: { role: 'user' | 'model'; content: string }[];
}

export interface RoomChatSession {
  cloneName: string;
  cloneContext: string;
  avatarName: string;
  roomName: string;
  roomTopic: string;
  history: { role: 'user' | 'model'; content: string }[];
}
