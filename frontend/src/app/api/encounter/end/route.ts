import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import type { EncounterSession } from '@/lib/redis';
import { createClient } from '@supabase/supabase-js';

interface EndRequest {
  sessionId: string;
}

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as EndRequest;

  const raw = await getRedis().get<string>(`encounter:${sessionId}`);
  if (!raw) {
    return NextResponse.json({ ok: true });
  }

  const session: EncounterSession =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Supabase が設定済みであれば DB に保存
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && session.history.length > 1) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from('encounter_logs').insert({
      clone_id: session.cloneId,
      dialogue: session.history,
    });
  }

  await getRedis().del(`encounter:${sessionId}`);

  return NextResponse.json({ ok: true });
}
