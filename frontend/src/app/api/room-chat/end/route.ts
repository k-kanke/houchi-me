import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId: string };
  await getRedis().del(`room-chat:${sessionId}`);
  return NextResponse.json({ ok: true });
}
