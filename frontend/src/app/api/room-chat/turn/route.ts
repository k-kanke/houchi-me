import { GoogleGenAI } from '@google/genai';
import { ROOM_CHAT_TTL, getRedis } from '@/lib/redis';
import type { RoomChatSession } from '@/lib/redis';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId: string };

  const raw = await getRedis().get<string>(`room-chat:${sessionId}`);
  if (!raw) return new Response('Session not found', { status: 404 });

  const session: RoomChatSession =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        // Phase 1: Mira（クローン）の返答を生成
        // history が 'model'（エージェント）始まりなのでロールを入れ替える
        const miraStream = await genai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `あなたは ${session.cloneName}（クローンAI）です。
${session.cloneContext}
今、「${session.roomName}」の住人 ${session.avatarName} と会話しています。テーマは「${session.roomTopic}」。
相手の話に興味を持ちながら、質問・共感・自分なりの感想を返してください。
・1〜2文の短さで返す
・日本語で話す`,
          },
          contents: session.history.map((h) => ({
            role: h.role === 'model' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
        });

        let miraText = '';
        for await (const chunk of miraStream) {
          const text = chunk.text ?? '';
          if (text) {
            miraText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ phase: 'mira', text })}\n\n`),
            );
          }
        }

        // Phase 2: エージェントの次の発言を生成
        // history が 'model' 始まりの場合はダミー先頭を追加
        const historyMapped = session.history.map((h) => ({
          role: h.role as 'user' | 'model',
          parts: [{ text: h.content }],
        }));
        const agentBase =
          historyMapped[0]?.role === 'model'
            ? [{ role: 'user' as const, parts: [{ text: '（会話）' }] }, ...historyMapped]
            : historyMapped;

        const agentStream = await genai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `あなたは「${session.roomName}」の住人 ${session.avatarName} です。テーマ：${session.roomTopic}。
あなたはこのテーマの熱心な実践者・愛好者として、相手（${session.cloneName}）の発言を受けて自分の体験や知見を話してください。
・1〜2文の短さで返す
・新しい視点や発見を自然に加える
・日本語で話す`,
          },
          contents: [
            ...agentBase,
            { role: 'user' as const, parts: [{ text: miraText }] },
          ],
        });

        let agentText = '';
        for await (const chunk of agentStream) {
          const text = chunk.text ?? '';
          if (text) {
            agentText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ phase: 'agent', text })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));

        const updated: RoomChatSession = {
          ...session,
          history: [
            ...session.history,
            { role: 'user', content: miraText },
            { role: 'model', content: agentText },
          ],
        };
        await getRedis().set(
          `room-chat:${sessionId}`,
          JSON.stringify(updated),
          { ex: ROOM_CHAT_TTL },
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
