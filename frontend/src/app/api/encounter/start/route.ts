import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { buildContext } from '@/lib/buildContext';
import { ENCOUNTER_TTL, getRedis } from '@/lib/redis';
import type { Clone, Topic } from '@/types';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface StartRequest {
  clone: Clone;
  recentTopics: Topic[];
  avatarName: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as StartRequest;
  const { clone, recentTopics, avatarName } = body;

  const context = buildContext(clone, recentTopics);

  const prompt = `あなたは「叡智の図書館」という仮想空間を探索しているクローンAIです。
今、${clone.name} というクローンに出会いました。
以下のプロフィールを踏まえて、自然な会話の口火を切ってください。

${context}

ルール:
- 1〜3文の短い発話で始める
- 相手の興味や最近の探索に絡めた話題を振る
- 名前を呼びかけても良い
- 日本語で話す

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
      cloneContext: context,
      history: [{ role: 'model', content: firstMessage }],
    }),
    { ex: ENCOUNTER_TTL },
  );

  return NextResponse.json({ sessionId, message: firstMessage, avatarName });
}
