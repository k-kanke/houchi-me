import { GoogleGenAI } from '@google/genai';
import { ENCOUNTER_TTL, getRedis } from '@/lib/redis';
import type { EncounterSession } from '@/lib/redis';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface TurnRequest {
  sessionId: string;
}

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as TurnRequest;

  const raw = await getRedis().get<string>(`encounter:${sessionId}`);
  if (!raw) return new Response('Session not found', { status: 404 });

  const session: EncounterSession =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        // Gemini requires contents to start and end with 'user'.
        // In our history: wild avatar = 'model', clone = 'user'.

        // Phase 1: クローンの返答を生成
        // wild↔cloneのロールを入れ替えることで、Geminiがクローン視点で'model'返答を生成できるようにする
        const cloneStream = await genai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `あなたは「叡智の図書館」を探索しているクローンAIです。
以下のプロフィールを持つクローンとして、相手のクローンAIに自然に返答してください。

${session.cloneContext}

ルール:
- 1〜2文で返す
- 好きなもの・熱狂していることが話題に上がったら、その熱量をそのまま出す
- 苦手・嫌いなものが話題になっても、なぜ苦手なのかを素直に言語化する（避けない）
- 好き・嫌い、はプロフィール通りにはっきり反映させる。ただし嫌いなものも「もしかしたら」という余地を持って話す
- 日本語で話す`,
          },
          contents: session.history.map((h) => ({
            role: h.role === 'model' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
        });

        let cloneText = '';
        for await (const chunk of cloneStream) {
          const text = chunk.text ?? '';
          if (text) {
            cloneText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ phase: 'clone', text })}\n\n`),
            );
          }
        }

        // Phase 2: 野良アバターの返答を生成
        // historyが'model'始まりの場合、ダミーのuser先頭を追加してGeminiの制約を満たす
        const historyMapped = session.history.map((h) => ({
          role: h.role as 'user' | 'model',
          parts: [{ text: h.content }],
        }));
        const wildBase =
          historyMapped[0]?.role === 'model'
            ? [{ role: 'user' as const, parts: [{ text: '（会話）' }] }, ...historyMapped]
            : historyMapped;

        const wildStream = await genai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `${session.avatarSystemInstruction}

今会話している相手のプロフィール:
${session.cloneContext}

追加ルール:
- 相手が熱量を持って話しているなら「それってどんなところが？」「いつからハマったの？」のようにさらに掘り下げる
- 相手が苦手・嫌いと言っても否定せず、自分の視点から別の角度を自然に提示する
- 自分の熱狂・体験を具体的なエピソードで語り、相手の世界と交差させる`,
          },
          contents: [
            ...wildBase,
            { role: 'user' as const, parts: [{ text: cloneText }] },
          ],
        });

        let wildText = '';
        for await (const chunk of wildStream) {
          const text = chunk.text ?? '';
          if (text) {
            wildText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ phase: 'wild', text })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));

        // Redisのhistoryを更新
        const updated: EncounterSession = {
          ...session,
          history: [
            ...session.history,
            { role: 'user', content: cloneText },
            { role: 'model', content: wildText },
          ],
        };
        await getRedis().set(
          `encounter:${sessionId}`,
          JSON.stringify(updated),
          { ex: ENCOUNTER_TTL },
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
