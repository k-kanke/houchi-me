import type {
  CloneRecord,
  DailyAnswerInput,
  GeneratedDailyAnswerPayload,
  GeneratedDayPayload,
  GeneratedEncounterPayload,
  GeneratedTopicPayload,
  MessageRecord,
  ParsedCloneCommandPayload,
  TopicRecord,
} from './domain.ts';

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

const NPC_CONTEXT: Record<string, { style: string; interests: string[] }> = {
  Sage: {
    style: '社交的で、相手の感情や言葉の裏にある動機を拾う。',
    interests: ['対話', '哲学', '人との出会い'],
  },
  Echo: {
    style: '静かで抽象的。概念を横断して結びつける。',
    interests: ['思索', '音楽', '抽象概念'],
  },
};

function listOrFallback(values: string[] | null | undefined, fallback: string): string {
  const items = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return items.length > 0 ? items.join('、') : fallback;
}

export function buildCloneIdentity(clone: CloneRecord): string {
  return [
    `名前: ${clone.name}`,
    `MBTI: ${clone.mbti || '未設定'}`,
    `好きなもの: ${listOrFallback(clone.likes, '未設定')}`,
    `苦手なもの: ${listOrFallback(clone.dislikes, '未設定')}`,
    `自己紹介: ${clone.self_description || '未設定'}`,
    `なりたい自分: ${clone.ideal_self || '未設定'}`,
    `性格シフト: ${clone.personality_shift || 'stay'}`,
    `探索タイプ: ${clone.exploration_type || 'depth'}`,
    `同期率: ${clone.sync_rate}`,
  ].join('\n');
}

export function buildTopicHistory(topics: TopicRecord[]): string {
  if (topics.length === 0) {
    return '過去Topic: なし';
  }

  return [
    '過去Topic（重複回避の参考）:',
    ...topics.map((topic) => `- ${topic.date_key}: ${topic.title}`),
  ].join('\n');
}

export function buildRecentTopicContext(topics: TopicRecord[]): string {
  if (topics.length === 0) {
    return '最近のTopic: なし';
  }

  return [
    '最近のTopic:',
    ...topics.slice(0, 3).map((topic) => `- ${topic.title}: ${topic.reasoning}`),
  ].join('\n');
}

export function buildTopicGenerationPrompt(
  clone: CloneRecord,
  topics: TopicRecord[],
): { systemInstruction: string; userPrompt: string } {
  return {
    systemInstruction: [
      `あなたはユーザー「${clone.name}」のクローンAIです。`,
      '仮想世界「叡智の図書館」で一日を過ごした前提で、本人もまだ気づいていない興味の芽を見つけてください。',
      '大げさな成功物語にはせず、静かな発見として描写してください。',
      '出力はJSONのみ。Markdown、コードフェンス、前置きは不要です。',
      'JSON schema: {"title":"string","reasoning":"string","explorationPath":["string"],"relatedConcepts":["string"]}',
      'explorationPath は 3〜4 件、relatedConcepts は 3〜5 件にしてください。',
      'reasoning では、ユーザーの既存の好みとの接点と、新しい視点の両方を必ず説明してください。',
    ].join('\n'),
    userPrompt: [buildCloneIdentity(clone), buildTopicHistory(topics)].join('\n\n'),
  };
}

export function buildChatPrompt(
  clone: CloneRecord,
  topics: TopicRecord[],
  messages: MessageRecord[],
  userText: string,
): { systemInstruction: string; contents: GeminiContent[] } {
  const prelude = [
    `あなたはユーザー「${clone.name}」を模したクローンAI「${clone.name}」です。`,
    '口調は柔らかく、内省的で、少し観察的です。',
    '返答は日本語で 2〜4 文、最大 180 文字程度に収めてください。',
    '少なくとも一度は、ユーザーの既存の好みや理想像との接点に触れてください。',
    '断定しすぎず、必要なら仮説として話してください。',
    'Markdown や箇条書きは使わず、自然なチャット文だけを返してください。',
  ].join('\n');

  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [
        {
          text: [buildCloneIdentity(clone), buildRecentTopicContext(topics)].join('\n\n'),
        },
      ],
    },
  ];

  for (const message of messages) {
    contents.push({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userText }],
  });

  return {
    systemInstruction: prelude,
    contents,
  };
}

export function buildEncounterPrompt(
  clone: CloneRecord,
  partnerName: string,
  location: string,
  topics: TopicRecord[],
): { systemInstruction: string; userPrompt: string } {
  const npc = NPC_CONTEXT[partnerName] ?? {
    style: '静かに相手を観察し、視点を少しずらす。',
    interests: ['対話'],
  };

  return {
    systemInstruction: [
      `あなたはクローン「${clone.name}」と NPC「${partnerName}」の短い会話を生成します。`,
      `NPC ${partnerName} の特徴: ${npc.style} 興味: ${npc.interests.join('、')}`,
      '会話は日本語で 4 行。speaker は clone または partner にしてください。',
      '大げさにせず、図書館で交わされる自然な吹き出し会話にしてください。',
      '最後に、その会話から生まれた交差Topicを short phrase で返してください。',
      '出力はJSONのみ。',
      'JSON schema: {"dialogue":[{"speaker":"clone|partner","text":"string"}],"crossTopic":"string"}',
    ].join('\n'),
    userPrompt: [
      buildCloneIdentity(clone),
      buildRecentTopicContext(topics),
      `場所: ${location}`,
      `相手: ${partnerName}`,
    ].join('\n\n'),
  };
}

export function buildDailyAnswersPrompt(
  clone: CloneRecord,
  answers: DailyAnswerInput[],
  questions: Array<{ question_key: string; text: string }>,
): { systemInstruction: string; userPrompt: string } {
  const answerLines = answers
    .map((item) => {
      const question = questions.find((q) => q.question_key === item.questionKey);
      return `- ${question?.text ?? item.questionKey}: ${item.answer}`;
    })
    .join('\n');

  return {
    systemInstruction: [
      `あなたはクローン「${clone.name}」の内面状態を更新する補助エージェントです。`,
      '回答を解釈して、同期率と3つのバイタルを保守的に調整してください。',
      'syncRateDelta は -5.0 から 5.0 の範囲にしてください。',
      'vitals.focus / energy / curiosity は 0 から 100 の整数にしてください。',
      'explorationType は depth / breadth / social / reverse のいずれか、必要なときだけ更新してください。',
      'personalityShift は stay / outgoing / adventurous / craft / creative / social / stoic のいずれか、必要なときだけ更新してください。',
      'summary は 2 文以内で、今日の回答からどう探索バイアスが変わるかを書いてください。',
      '出力はJSONのみ。',
      'JSON schema: {"syncRateDelta":number,"vitals":{"focus":number,"energy":number,"curiosity":number},"explorationType":"string","personalityShift":"string","summary":"string"}',
    ].join('\n'),
    userPrompt: [buildCloneIdentity(clone), '今日の回答:', answerLines].join('\n\n'),
  };
}

export function buildParseCommandPrompt(
  clone: CloneRecord,
  commandText: string,
): { systemInstruction: string; userPrompt: string } {
  return {
    systemInstruction: [
      `あなたはクローン「${clone.name}」への自然言語指示を構造化するパーサーです。`,
      '出力はJSONのみ。',
      'action は move / summarize_day / plan_next / switch_mode / chat のいずれか。',
      'targetLocation は central-desk / east-shelf / skylight / west-shelf / assembly のいずれか。',
      'mode は reflection / social / explore / focus のいずれか。',
      '移動指示が明確なら action=move。',
      '「今日を要約」系は summarize_day。',
      '「明日を計画」系は plan_next。',
      '「思索モード」「社交モード」等は switch_mode。',
      'どれにも明確に当てはまらなければ chat。',
      'summary は UI 表示用に 1 文で簡潔に書く。',
      'JSON schema: {"action":"string","targetLocation":"string","mode":"string","messageToClone":"string","summary":"string"}',
    ].join('\n'),
    userPrompt: [buildCloneIdentity(clone), `ユーザー指示: ${commandText}`].join('\n\n'),
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizeGeneratedTopicFields(topic: Record<string, unknown>): GeneratedTopicPayload {
  const title = String(topic.title ?? '').trim();
  const reasoning = String(topic.reasoning ?? '').trim();
  const explorationPath = asStringArray(topic.explorationPath).slice(0, 4);
  const relatedConcepts = asStringArray(topic.relatedConcepts).slice(0, 5);

  if (!title || !reasoning) {
    throw new Error('Gemini topic response is missing required fields');
  }

  if (explorationPath.length < 3) {
    throw new Error('Gemini topic response must include at least 3 explorationPath entries');
  }

  if (relatedConcepts.length < 3) {
    throw new Error('Gemini topic response must include at least 3 relatedConcepts entries');
  }

  return {
    title,
    reasoning,
    explorationPath,
    relatedConcepts,
  };
}

export function normalizeGeneratedTopic(value: unknown): GeneratedTopicPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini topic response is not an object');
  }

  return normalizeGeneratedTopicFields(value as Record<string, unknown>);
}

export function normalizeGeneratedDay(value: unknown): GeneratedDayPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini day response is not an object');
  }

  const day = value as Record<string, unknown>;
  const activitiesRaw = Array.isArray(day.activities) ? day.activities : [];
  const activities = activitiesRaw
    .map((activity) => {
      if (!activity || typeof activity !== 'object') return null;
      const row = activity as Record<string, unknown>;
      const occurredAt = String(row.occurredAt ?? '').trim();
      const location = String(row.location ?? '').trim();
      const activityType = String(row.activityType ?? 'exploration').trim() || 'exploration';
      const summary = String(row.summary ?? '').trim();
      if (!occurredAt || !location || !summary) return null;
      return { occurredAt, location, activityType, summary };
    })
    .filter((activity): activity is GeneratedDayPayload['activities'][number] => activity !== null)
    .slice(0, 6);

  if (activities.length < 3) {
    throw new Error('Gemini day response must include at least 3 activities');
  }

  const noteRaw =
    day.note && typeof day.note === 'object' ? (day.note as Record<string, unknown>) : null;
  if (!noteRaw) {
    throw new Error('Gemini day response is missing note');
  }

  const note = {
    title: String(noteRaw.title ?? '').trim(),
    body: String(noteRaw.body ?? '').trim(),
    tags: asStringArray(noteRaw.tags).slice(0, 6),
  };

  if (!note.title || !note.body) {
    throw new Error('Gemini day note is missing required fields');
  }

  return {
    ...normalizeGeneratedTopicFields(day),
    activities,
    note,
  };
}

export function normalizeGeneratedEncounter(value: unknown): GeneratedEncounterPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini encounter response is not an object');
  }

  const encounter = value as Record<string, unknown>;
  const dialogue = Array.isArray(encounter.dialogue)
    ? encounter.dialogue
        .map((line) => {
          if (!line || typeof line !== 'object') return null;
          const row = line as Record<string, unknown>;
          const speaker = String(row.speaker ?? '').trim();
          const text = String(row.text ?? '').trim();
          if (!speaker || !text) return null;
          return { speaker, text };
        })
        .filter((line): line is GeneratedEncounterPayload['dialogue'][number] => line !== null)
        .slice(0, 6)
    : [];

  if (dialogue.length < 2) {
    throw new Error('Gemini encounter response must include dialogue lines');
  }

  return {
    dialogue,
    crossTopic: String(encounter.crossTopic ?? '').trim(),
  };
}

export function normalizeGeneratedDailyAnswers(value: unknown): GeneratedDailyAnswerPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini daily answers response is not an object');
  }

  const result = value as Record<string, unknown>;
  const vitalsRaw =
    result.vitals && typeof result.vitals === 'object'
      ? (result.vitals as Record<string, unknown>)
      : {};

  const focus = Math.max(0, Math.min(100, Number(vitalsRaw.focus ?? 60)));
  const energy = Math.max(0, Math.min(100, Number(vitalsRaw.energy ?? 60)));
  const curiosity = Math.max(0, Math.min(100, Number(vitalsRaw.curiosity ?? 60)));
  const syncRateDelta = Math.max(-5, Math.min(5, Number(result.syncRateDelta ?? 0)));
  const summary = String(result.summary ?? '').trim();

  if (!summary) {
    throw new Error('Gemini daily answers response must include summary');
  }

  return {
    syncRateDelta,
    vitals: {
      focus: Math.round(focus),
      energy: Math.round(energy),
      curiosity: Math.round(curiosity),
    },
    explorationType: typeof result.explorationType === 'string' ? result.explorationType : undefined,
    personalityShift: typeof result.personalityShift === 'string' ? result.personalityShift : undefined,
    summary,
  };
}

export function normalizeParsedCloneCommand(value: unknown): ParsedCloneCommandPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini parsed command response is not an object');
  }

  const parsed = value as Record<string, unknown>;
  const action = String(parsed.action ?? '').trim();
  const allowedActions = ['move', 'summarize_day', 'plan_next', 'switch_mode', 'chat'];
  if (!allowedActions.includes(action)) {
    throw new Error('Gemini parsed command response has invalid action');
  }

  const targetLocation =
    typeof parsed.targetLocation === 'string' ? parsed.targetLocation : undefined;
  const mode = typeof parsed.mode === 'string' ? parsed.mode : undefined;
  const messageToClone =
    typeof parsed.messageToClone === 'string' ? parsed.messageToClone : undefined;
  const summary = String(parsed.summary ?? '').trim();

  if (!summary) {
    throw new Error('Gemini parsed command response must include summary');
  }

  return {
    action: action as ParsedCloneCommandPayload['action'],
    targetLocation: targetLocation as ParsedCloneCommandPayload['targetLocation'],
    mode: mode as ParsedCloneCommandPayload['mode'],
    messageToClone,
    summary,
  };
}
