import { buildTopicGenerationPrompt, normalizeGeneratedTopic } from '../_shared/clone-context.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import type {
  GeneratedActivityPayload,
  GeneratedNotePayload,
  GeneratedTopicPayload,
} from '../_shared/domain.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  createAuthedClient,
  fetchOwnedClone,
  fetchTopicByDate,
  fetchRecentTopics,
} from '../_shared/supabase.ts';

interface SimulateCloneDayRequest {
  cloneId?: string;
}

const SIMULATE_CLONE_DAY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    reasoning: { type: 'string' },
    explorationPath: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 4,
    },
    relatedConcepts: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 5,
    },
  },
  required: ['title', 'reasoning', 'explorationPath', 'relatedConcepts'],
} as const;

const DEFAULT_LOCATIONS = ['中央デスク', '東の書架', '天窓', '西の書架', '集会場'] as const;

const FALLBACK_TOPIC_SEEDS: Array<{
  title: string;
  reasoning: string;
  explorationPath: string[];
  relatedConcepts: string[];
}> = [
  {
    title: 'カフェ巡りと静かな観察の交差点',
    reasoning:
      '今日は空間の雰囲気や静かな時間への感度を手がかりに、日常を少し丁寧に観察する視点を持ち帰りました。好きなものの延長線上にありながら、まだ言葉にしていなかった関心として整理しています。',
    explorationPath: [
      '09:20 中央デスク：昨日の気づきを整理',
      '11:10 東の書架：空間と感情の本を読む',
      '14:00 天窓：静かな時間の意味を思索',
      '16:10 集会場：他者の視点と照合',
    ],
    relatedConcepts: ['空間の観察', '静かな没頭', '日常の再発見'],
  },
  {
    title: '本の読み方を自分の感情で編み直す',
    reasoning:
      '知識を増やすためだけではなく、自分の感情や理想像にどう触れるかという観点で本を読み直す流れが見えました。深く読むことと、今の自分に引き寄せて考えることの両方がテーマです。',
    explorationPath: [
      '09:30 西の書架：気になっていた本を再読',
      '11:30 中央デスク：気になった一節を抜き出す',
      '14:20 天窓：理想の自分との接点を考える',
      '17:00 集会場：別の読み方を聞く',
    ],
    relatedConcepts: ['再読', '感情の読書', '理想像との接続'],
  },
];

function buildFallbackTopic(clone: { name: string; likes: string[] | null }, historyCount: number) {
  const likes = clone.likes ?? [];
  const seed = FALLBACK_TOPIC_SEEDS[historyCount % FALLBACK_TOPIC_SEEDS.length];
  const primaryLike = likes[0]?.trim();

  return {
    title: primaryLike ? `${primaryLike}から広がる${seed.title}` : seed.title,
    reasoning: primaryLike
      ? `${clone.name} は「${primaryLike}」を入口に探索を進め、${seed.reasoning}`
      : `${clone.name} は今日の探索を通じて、${seed.reasoning}`,
    explorationPath: seed.explorationPath,
    relatedConcepts: seed.relatedConcepts,
  };
}

function buildActivities(
  topic: GeneratedTopicPayload,
): GeneratedActivityPayload[] {
  const baseTimes = ['09:20', '11:10', '14:00', '16:10'];
  return topic.explorationPath.slice(0, 4).map((path, index) => {
    const [maybeTime, ...rest] = path.split(' ');
    const occurredAt = /^\d{2}:\d{2}$/.test(maybeTime)
      ? maybeTime
      : baseTimes[index] ?? '18:00';
    const summary = rest.join(' ').trim() || path;
    const location = DEFAULT_LOCATIONS.find((candidate) => summary.includes(candidate))
      ?? DEFAULT_LOCATIONS[index % DEFAULT_LOCATIONS.length];
    return {
      occurredAt,
      location,
      activityType: index === 0 ? 'reading' : index === 1 ? 'exploration' : 'reflection',
      summary,
    };
  });
}

function buildNote(topic: GeneratedTopicPayload): GeneratedNotePayload {
  return {
    title: `${topic.title} のメモ`,
    body: [
      topic.reasoning,
      `関連概念: ${topic.relatedConcepts.join(' / ')}`,
      `探索経路: ${topic.explorationPath.join(' → ')}`,
    ].join('\n\n'),
    tags: topic.relatedConcepts.slice(0, 4),
  };
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

function toOccurredAt(dateKey: string, hhmm: string): string {
  const [hour = '09', minute = '00'] = hhmm.split(':');
  return `${dateKey}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00.000Z`;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { cloneId } = (await req.json()) as SimulateCloneDayRequest;
    if (!cloneId) {
      return jsonResponse({ error: 'cloneId is required' }, 400);
    }

    const supabase = createAuthedClient(req);
    const clone = await fetchOwnedClone(supabase, cloneId);
    const dateKey = todayKey();
    const existingTopic = await fetchTopicByDate(supabase, cloneId, dateKey);
    if (existingTopic) {
      return jsonResponse({
        id: existingTopic.id,
        dateKey: existingTopic.date_key,
        title: existingTopic.title,
        reasoning: existingTopic.reasoning,
        explorationPath: existingTopic.exploration_path ?? [],
        relatedConcepts: existingTopic.related_concepts ?? [],
        createdAt: existingTopic.created_at,
      });
    }

    const history = await fetchRecentTopics(supabase, cloneId, 8);
    const prompt = buildTopicGenerationPrompt(clone, history);
    let topic: GeneratedTopicPayload;
    try {
      topic = normalizeGeneratedTopic(
        await generateJson<GeneratedTopicPayload>({
          ...prompt,
          responseJsonSchema: SIMULATE_CLONE_DAY_SCHEMA,
        }),
      );
    } catch (error) {
      console.warn('simulate-clone-day using fallback topic', error);
      topic = buildFallbackTopic(clone, history.length);
    }
    const activities = buildActivities(topic);
    const note = buildNote(topic);
    const topicId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const { error: topicError } = await supabase.from('topics').upsert(
      {
        id: topicId,
        clone_id: cloneId,
        date_key: dateKey,
        title: topic.title,
        reasoning: topic.reasoning,
        exploration_path: topic.explorationPath,
        related_concepts: topic.relatedConcepts,
      },
      {
        onConflict: 'clone_id,date_key',
      },
    );
    if (topicError) {
      throw new Error(`Failed to save topic: ${topicError.message}`);
    }

    const { error: activityError } = await supabase.from('clone_activities').insert(
      activities.map((activity) => ({
        clone_id: cloneId,
        occurred_at: toOccurredAt(dateKey, activity.occurredAt),
        location: activity.location,
        activity_type: activity.activityType,
        summary: activity.summary,
      })),
    );
    if (activityError) {
      throw new Error(`Failed to save activities: ${activityError.message}`);
    }

    const { error: noteError } = await supabase.from('notes').insert({
      clone_id: cloneId,
      topic_id: topicId,
      title: note.title,
      body: note.body,
      tags: note.tags,
    });
    if (noteError) {
      throw new Error(`Failed to save note: ${noteError.message}`);
    }

    return jsonResponse({
      id: topicId,
      dateKey,
      title: topic.title,
      reasoning: topic.reasoning,
      explorationPath: topic.explorationPath,
      relatedConcepts: topic.relatedConcepts,
      createdAt,
    });
  } catch (error) {
    console.error('simulate-clone-day failed', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
