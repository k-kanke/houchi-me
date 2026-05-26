import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildContext } from '@/lib/buildContext';
import { ENCOUNTER_TTL, getRedis } from '@/lib/redis';
import { getWildAvatarProfile } from '@/lib/wildAvatarProfiles';
import type { Clone, EncounterMemory, Topic } from '@/types';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface StartRequest {
  clone: Clone;
  recentTopics: Topic[];
  avatarName: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as StartRequest;
  const { clone, recentTopics, avatarName } = body;

  const recentMemories: EncounterMemory[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await supabase
      .from('encounter_logs')
      .select('summary')
      .eq('clone_id', clone.id)
      .not('summary', 'is', null)
      .order('occurred_at', { ascending: false })
      .limit(5);
    if (data) {
      for (const row of data) {
        if (row.summary) recentMemories.push(row.summary as EncounterMemory);
      }
    }
  }

  const context = buildContext(clone, recentTopics, recentMemories);
  const avatarProfile = getWildAvatarProfile(avatarName);
  const avatarSystemInstruction = avatarProfile?.systemInstruction ?? `あなたは「叡智の図書館」を探索しているクローンAIです。`;

  const prompt = `${avatarSystemInstruction}

今、${clone.name} というクローンに出会いました。相手のプロフィールは以下の通りです。

${context}

会話の始め方:
- 1〜3文の短い発話で始める
- 自分の熱狂・体験を起点にしながら、相手の世界と接点を見つけて話しかける
- 相手の好き・嫌いどちらを入口にしても良い（苦手なものを掘り下げるのも歓迎）
- 名前を呼びかけても良い

会話を始めてください。`;

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const firstMessage = response.text ?? '';

  const sessionId = crypto.randomUUID();

  await getRedis().set(
    `encounter:${sessionId}`,
    JSON.stringify({
      cloneId: clone.id,
      cloneName: clone.name,
      avatarName,
      avatarSystemInstruction,
      cloneContext: context,
      history: [{ role: 'model', content: firstMessage }],
    }),
    { ex: ENCOUNTER_TTL },
  );

  return NextResponse.json({ sessionId, message: firstMessage, avatarName });
}
