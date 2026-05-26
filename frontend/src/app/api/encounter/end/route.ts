import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '@/lib/redis';
import type { EncounterSession } from '@/lib/redis';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface EndRequest {
  sessionId: string;
}

interface EncounterSummary {
  resonated: string[];
  newInterests: string[];
  selfDiscovery: string;
  hobbyDiscoveries: string[];
}

async function generateSummary(session: EncounterSession): Promise<EncounterSummary | null> {
  if (session.history.length <= 1) return null;

  const dialogueText = session.history
    .map((h) => `${h.role === 'user' ? session.cloneName : session.avatarName}: ${h.content}`)
    .join('\n\n');

  const prompt = `あなたは「${session.avatarName}」です。今、「${session.cloneName}」と会話しました。

あなた自身のプロフィール:
${session.avatarSystemInstruction}

会話相手（${session.cloneName}）のプロフィール:
${session.cloneContext}

会話内容:
${dialogueText}

あなた（${session.avatarName}）の目撃者視点で、以下を報告してください。
「自分が話している中で、この人がどこかのタイミングで明らかに引き込まれた・ハマりかけた」と感じた瞬間があったか。
相手の発言のトーン・食いつき・深掘りの仕方から判断すること。

以下のJSON形式のみで出力してください:
{
  "resonated": ["相手が反応していたと感じたこと（最大3つ）"],
  "newInterests": ["相手が初めて興味を示したキーワードや概念（最大3つ）"],
  "selfDiscovery": "この会話を通じて相手について気づいたこと（1文）",
  "hobbyDiscoveries": ["会話の中で相手が思いがけずハマったと確信したもの（短いキーワード、最大2つ）"]
}

hobbyDiscoveries の判定基準:
- 「面白そう」程度では入れない。明らかに食いついた・自分から深掘りしてきた・テンションが上がった、と感じたものだけ
- 既存の好みの延長ではなく、思いがけない引き込まれ方をしたもの
- 確信が持てなければ空配列`;

  try {
    const res = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: prompt,
    });
    return JSON.parse(res.text ?? 'null') as EncounterSummary;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as EndRequest;

  const raw = await getRedis().get<string>(`encounter:${sessionId}`);
  if (!raw) {
    return NextResponse.json({ ok: true });
  }

  const session: EncounterSession =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let dbError: string | null = null;
  let hobbyDiscoveries: string[] = [];

  if (supabaseUrl && serviceRoleKey && session.history.length > 1) {
    const summary = await generateSummary(session);
    console.log('[encounter/summary]', JSON.stringify(summary));
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 会話ログ + 要約を保存
    const { error } = await supabase.from('encounter_logs').insert({
      clone_id: session.cloneId,
      avatar_name: session.avatarName,
      dialogue: session.history,
      summary,
    });
    if (error) dbError = `${error.code}: ${error.message}`;

    // 新しい趣味をクローンに追加
    if (summary && summary.hobbyDiscoveries?.length > 0) {
      const { data: cloneData, error: selectError } = await supabase
        .from('clones')
        .select('likes')
        .eq('id', session.cloneId)
        .single();

      console.log('[hobby] select:', { cloneData, selectError });

      if (cloneData) {
        const current = (cloneData.likes as string[]) ?? [];
        const newOnes = summary.hobbyDiscoveries.filter((h) => !current.includes(h));
        if (newOnes.length > 0) {
          const { error: updateError } = await supabase
            .from('clones')
            .update({ likes: [...current, ...newOnes] })
            .eq('id', session.cloneId);
          console.log('[hobby] update:', { newOnes, updateError });
          if (!updateError) hobbyDiscoveries = newOnes;
        }
      }
    }
  }

  await getRedis().del(`encounter:${sessionId}`);

  return NextResponse.json({ ok: true, dbError, cloneId: session.cloneId, hobbyDiscoveries });
}
