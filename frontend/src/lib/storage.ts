import { getSupabase } from '@/lib/supabase';
import type { Clone, CloneActivity, EncounterLog, Feedback, Message, Topic } from '@/types';

export interface Storage {
  getClone(): Promise<Clone | null>;
  saveClone(clone: Clone): Promise<void>;
  clearClone(): Promise<void>;
  getTopics(): Promise<Topic[]>;
  getTodaysTopic(dateKey: string): Promise<Topic | null>;
  saveTopic(topic: Topic): Promise<void>;
  getTodayActivities(): Promise<CloneActivity[]>;
  getLatestActivity(): Promise<CloneActivity | null>;
  getFeedback(): Promise<Record<string, Feedback>>;
  saveFeedback(feedback: Feedback): Promise<void>;
  getMessages(): Promise<Message[]>;
  appendMessage(message: Message): Promise<void>;
  clearMessages(): Promise<void>;
  getEncounterLogs(): Promise<EncounterLog[]>;
  updateClone(partial: Partial<Clone>): Promise<Clone | null>;
}

const KEYS = {
  clone: 'houchi-me/clone',
  topics: 'houchi-me/topics',
  messages: 'houchi-me/messages',
  feedback: 'houchi-me/feedback',
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function parseExplorationPath(path: string, index: number) {
  const timeMatch = path.match(/^(\d{2}:\d{2})\s+(.+)$/);
  const time = timeMatch?.[1] ?? `${String(9 + index * 2).padStart(2, '0')}:00`;
  const summary = timeMatch?.[2] ?? path;
  const [locationCandidate, ...rest] = summary.split(/[：:]/);
  const location = rest.length > 0 ? locationCandidate.trim() : '叡智の図書館';
  const text = rest.length > 0 ? rest.join('：').trim() : summary;

  return { time, location, summary: text };
}

function topicToActivities(topic: Topic): CloneActivity[] {
  return topic.explorationPath
    .map((path, index) => {
      const parsed = parseExplorationPath(path, index);
      return {
        id: `${topic.id}-activity-${index}`,
        cloneId: '',
        occurredAt: `${topic.dateKey}T${parsed.time}:00.000Z`,
        location: parsed.location,
        activityType: index === 0 ? 'reading' : index === 1 ? 'exploration' : 'reflection',
        summary: parsed.summary,
        createdAt: topic.createdAt,
      };
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function buildMockEncounterLogs(clone: Clone | null): EncounterLog[] {
  const likes = clone?.likes ?? [];
  const primary = likes[0] ?? '最近の関心';
  const secondary = likes[1] ?? (clone?.idealSelf?.trim() || '新しい視点');
  const lower = primary.toLowerCase();

  if (lower.includes('サッカー') || lower.includes('フットボール')) {
    return [
      {
        id: 'mock-encounter-soccer-1',
        partnerName: 'Sage',
        location: '集会場',
        crossTopic: `${primary}の流れを読む感覚`,
        dialogue: [
          { speaker: 'Sage', text: `${primary}って、点より流れが変わる瞬間を見ていない？` },
          { speaker: clone?.name ?? 'Mira', text: 'うん、その一瞬で試合の空気が変わるのが好きかも' },
        ],
        createdAt: new Date().toISOString(),
        isMock: true,
      },
      {
        id: 'mock-encounter-soccer-2',
        partnerName: 'Echo',
        location: '天窓',
        crossTopic: `${secondary}を配置で考える視点`,
        dialogue: [
          { speaker: 'Echo', text: `${primary}のフォーメーションを見る目は、${secondary}を考える時にも出ていそう` },
          { speaker: clone?.name ?? 'Mira', text: '配置で見るって言い方、かなりしっくりくる' },
        ],
        createdAt: new Date(Date.now() - 60_000).toISOString(),
        isMock: true,
      },
    ];
  }

  if (lower.includes('ゲーム') || lower.includes('fps') || lower.includes('rpg')) {
    return [
      {
        id: 'mock-encounter-game-1',
        partnerName: 'Sage',
        location: '集会場',
        crossTopic: `${primary}で感じる没入感`,
        dialogue: [
          { speaker: 'Sage', text: `${primary}って、勝ち負けより世界に入り込めた時が残るんじゃない？` },
          { speaker: clone?.name ?? 'Mira', text: 'そうかも。攻略より、入り込めた感覚の方が思い出に残る' },
        ],
        createdAt: new Date().toISOString(),
        isMock: true,
      },
      {
        id: 'mock-encounter-game-2',
        partnerName: 'Echo',
        location: '天窓',
        crossTopic: `${secondary}をルート選択として考える`,
        dialogue: [
          { speaker: 'Echo', text: `${primary}でルートを選ぶ感覚は、${secondary}を選ぶ時の迷い方にも近いかもしれない` },
          { speaker: clone?.name ?? 'Mira', text: 'たしかに、自分でも分岐を選ぶ感覚で考えてるかも' },
        ],
        createdAt: new Date(Date.now() - 60_000).toISOString(),
        isMock: true,
      },
    ];
  }

  return [
    {
      id: 'mock-encounter-generic-1',
      partnerName: 'Sage',
      location: '集会場',
      crossTopic: `${primary}を好きな理由の言語化`,
      dialogue: [
        { speaker: 'Sage', text: `${primary}って、理由を言葉にするともっと輪郭が出そうだね` },
        { speaker: clone?.name ?? 'Mira', text: 'まだ曖昧だけど、確かにそこを考えると広がりそう' },
      ],
      createdAt: new Date().toISOString(),
      isMock: true,
    },
    {
      id: 'mock-encounter-generic-2',
      partnerName: 'Echo',
      location: '天窓',
      crossTopic: `${secondary}を通して見える別の自分`,
      dialogue: [
        { speaker: 'Echo', text: `${secondary}を入口にすると、今の自分を少し外から見直せるかもしれない` },
        { speaker: clone?.name ?? 'Mira', text: 'その視点はまだ持てていなかった気がする' },
      ],
      createdAt: new Date(Date.now() - 60_000).toISOString(),
      isMock: true,
    },
  ];
}

export class LocalStorageImpl implements Storage {
  async getClone(): Promise<Clone | null> {
    return readJSON<Clone | null>(KEYS.clone, null);
  }
  async saveClone(clone: Clone): Promise<void> {
    writeJSON(KEYS.clone, clone);
  }
  async clearClone(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(KEYS.clone);
  }
  async getTopics(): Promise<Topic[]> {
    return readJSON<Topic[]>(KEYS.topics, []);
  }
  async getTodaysTopic(dateKey: string): Promise<Topic | null> {
    const topics = await this.getTopics();
    return topics.find((t) => t.dateKey === dateKey) ?? null;
  }
  async saveTopic(topic: Topic): Promise<void> {
    const topics = await this.getTopics();
    const next = [topic, ...topics.filter((t) => t.id !== topic.id)];
    writeJSON(KEYS.topics, next);
  }
  async getTodayActivities(): Promise<CloneActivity[]> {
    const todaysTopic = await this.getTodaysTopic(todayKey());
    return todaysTopic ? topicToActivities(todaysTopic) : [];
  }
  async getLatestActivity(): Promise<CloneActivity | null> {
    const activities = await this.getTodayActivities();
    return activities[0] ?? null;
  }
  async getFeedback(): Promise<Record<string, Feedback>> {
    return readJSON<Record<string, Feedback>>(KEYS.feedback, {});
  }
  async saveFeedback(feedback: Feedback): Promise<void> {
    const fb = await this.getFeedback();
    fb[feedback.topicId] = feedback;
    writeJSON(KEYS.feedback, fb);
  }
  async getMessages(): Promise<Message[]> {
    return readJSON<Message[]>(KEYS.messages, []);
  }
  async appendMessage(message: Message): Promise<void> {
    const msgs = await this.getMessages();
    msgs.push(message);
    writeJSON(KEYS.messages, msgs);
  }
  async clearMessages(): Promise<void> {
    writeJSON(KEYS.messages, []);
  }
  async getEncounterLogs(): Promise<EncounterLog[]> {
    const clone = await this.getClone();
    return buildMockEncounterLogs(clone);
  }
  async updateClone(partial: Partial<Clone>): Promise<Clone | null> {
    const current = await this.getClone();
    if (!current) return null;
    const next = { ...current, ...partial };
    await this.saveClone(next);
    return next;
  }
}

// DB row → Clone
function rowToClone(r: Record<string, unknown>): Clone {
  return {
    id: r.id as string,
    name: r.name as string,
    mbti: r.mbti as string,
    likes: (r.likes as string[]) ?? [],
    dislikes: (r.dislikes as string[]) ?? [],
    selfDescription: r.self_description as string,
    idealSelf: r.ideal_self as string,
    personalityShift: r.personality_shift as Clone['personalityShift'],
    explorationType: r.exploration_type as Clone['explorationType'],
    syncRate: r.sync_rate as number,
    createdAt: r.created_at as string,
  };
}

// DB row → Topic
function rowToTopic(r: Record<string, unknown>): Topic {
  return {
    id: r.id as string,
    dateKey: r.date_key as string,
    title: r.title as string,
    reasoning: r.reasoning as string,
    explorationPath: (r.exploration_path as string[]) ?? [],
    relatedConcepts: (r.related_concepts as string[]) ?? [],
    createdAt: r.created_at as string,
  };
}

// DB row → Message
function rowToMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as string,
    role: r.role as Message['role'],
    text: r.text as string,
    createdAt: r.created_at as string,
  };
}

function rowToActivity(r: Record<string, unknown>): CloneActivity {
  return {
    id: r.id as string,
    cloneId: r.clone_id as string,
    occurredAt: r.occurred_at as string,
    location: r.location as string,
    activityType: r.activity_type as string,
    summary: r.summary as string,
    createdAt: r.created_at as string,
  };
}

function rowToEncounterLog(r: Record<string, unknown>): EncounterLog {
  return {
    id: r.id as string,
    partnerName: r.partner_name as string,
    location: (r.location as string) ?? '集会場',
    crossTopic: (r.cross_topic as string) ?? '',
    dialogue: Array.isArray(r.dialogue)
      ? (r.dialogue as Array<Record<string, unknown>>).map((line) => ({
        speaker: String(line.speaker ?? ''),
        text: String(line.text ?? ''),
      }))
      : [],
    createdAt: r.created_at as string,
  };
}

export class SupabaseImpl implements Storage {
  private async ensureUser() {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (user) return user;
    const { data, error } = await getSupabase().auth.signInAnonymously();
    if (error || !data.user) throw new Error('auth failed');
    return data.user;
  }

  private async fetchCloneId(): Promise<string | null> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) return null;
    const { data } = await getSupabase()
      .from('clones')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.id ?? null;
  }

  async getClone(): Promise<Clone | null> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) return null;
    const { data } = await getSupabase()
      .from('clones')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    return data ? rowToClone(data as Record<string, unknown>) : null;
  }

  async saveClone(clone: Clone): Promise<void> {
    const user = await this.ensureUser();
    const { error } = await getSupabase().from('clones').upsert({
      id: clone.id,
      user_id: user.id,
      name: clone.name,
      mbti: clone.mbti,
      likes: clone.likes,
      dislikes: clone.dislikes,
      self_description: clone.selfDescription,
      ideal_self: clone.idealSelf,
      personality_shift: clone.personalityShift,
      exploration_type: clone.explorationType,
      sync_rate: clone.syncRate,
    });
    if (error) throw error;
  }

  async clearClone(): Promise<void> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (user) {
      await getSupabase().from('clones').delete().eq('user_id', user.id);
    }
    await getSupabase().auth.signOut();
  }

  async getTopics(): Promise<Topic[]> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return [];
    const { data } = await getSupabase()
      .from('topics')
      .select('*')
      .eq('clone_id', cloneId)
      .order('created_at', { ascending: false });
    return (data ?? []).map((r) => rowToTopic(r as Record<string, unknown>));
  }

  async getTodaysTopic(dateKey: string): Promise<Topic | null> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return null;
    const { data } = await getSupabase()
      .from('topics')
      .select('*')
      .eq('clone_id', cloneId)
      .eq('date_key', dateKey)
      .maybeSingle();
    return data ? rowToTopic(data as Record<string, unknown>) : null;
  }

  async saveTopic(topic: Topic): Promise<void> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return;
    const { error } = await getSupabase().from('topics').upsert({
      id: topic.id,
      clone_id: cloneId,
      date_key: topic.dateKey,
      title: topic.title,
      reasoning: topic.reasoning,
      exploration_path: topic.explorationPath,
      related_concepts: topic.relatedConcepts,
    });
    if (error) throw error;
  }

  async getTodayActivities(): Promise<CloneActivity[]> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const { data, error } = await getSupabase()
      .from('clone_activities')
      .select('*')
      .eq('clone_id', cloneId)
      .gte('occurred_at', start.toISOString())
      .lt('occurred_at', end.toISOString())
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => rowToActivity(r as Record<string, unknown>));
  }

  async getLatestActivity(): Promise<CloneActivity | null> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const { data, error } = await getSupabase()
      .from('clone_activities')
      .select('*')
      .eq('clone_id', cloneId)
      .gte('occurred_at', start.toISOString())
      .lt('occurred_at', end.toISOString())
      .order('occurred_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToActivity(data as Record<string, unknown>) : null;
  }

  async getFeedback(): Promise<Record<string, Feedback>> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return {};
    const { data } = await getSupabase()
      .from('feedback')
      .select('topic_id, kind, created_at')
      .in(
        'topic_id',
        (
          await getSupabase().from('topics').select('id').eq('clone_id', cloneId)
        ).data?.map((r) => r.id) ?? [],
      );
    const result: Record<string, Feedback> = {};
    for (const r of data ?? []) {
      result[r.topic_id] = {
        topicId: r.topic_id,
        kind: r.kind as Feedback['kind'],
        createdAt: r.created_at,
      };
    }
    return result;
  }

  async saveFeedback(feedback: Feedback): Promise<void> {
    const { error } = await getSupabase().from('feedback').upsert({
      topic_id: feedback.topicId,
      kind: feedback.kind,
    });
    if (error) throw error;
  }

  async getMessages(): Promise<Message[]> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return [];
    const { data } = await getSupabase()
      .from('messages')
      .select('*')
      .eq('clone_id', cloneId)
      .order('created_at', { ascending: true });
    return (data ?? []).map((r) => rowToMessage(r as Record<string, unknown>));
  }

  async appendMessage(message: Message): Promise<void> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return;
    const { error } = await getSupabase().from('messages').insert({
      id: message.id,
      clone_id: cloneId,
      role: message.role,
      text: message.text,
    });
    if (error) throw error;
  }

  async clearMessages(): Promise<void> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return;
    const { error } = await getSupabase()
      .from('messages')
      .delete()
      .eq('clone_id', cloneId);
    if (error) throw error;
  }

  async getEncounterLogs(): Promise<EncounterLog[]> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return [];
    const { data, error } = await getSupabase()
      .from('clone_encounters')
      .select('*')
      .eq('clone_id', cloneId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    const logs = (data ?? []).map((r) => rowToEncounterLog(r as Record<string, unknown>));
    if (logs.length > 0) return logs;
    return buildMockEncounterLogs(await this.getClone());
  }

  async updateClone(partial: Partial<Clone>): Promise<Clone | null> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) return null;
    const updates: Record<string, unknown> = {};
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.mbti !== undefined) updates.mbti = partial.mbti;
    if (partial.likes !== undefined) updates.likes = partial.likes;
    if (partial.dislikes !== undefined) updates.dislikes = partial.dislikes;
    if (partial.selfDescription !== undefined) updates.self_description = partial.selfDescription;
    if (partial.idealSelf !== undefined) updates.ideal_self = partial.idealSelf;
    if (partial.personalityShift !== undefined) updates.personality_shift = partial.personalityShift;
    if (partial.explorationType !== undefined) updates.exploration_type = partial.explorationType;
    if (partial.syncRate !== undefined) updates.sync_rate = partial.syncRate;
    const { error } = await getSupabase().from('clones').update(updates).eq('user_id', user.id);
    if (error) throw error;
    return this.getClone();
  }
}

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const storage: Storage = isSupabaseConfigured
  ? new SupabaseImpl()
  : new LocalStorageImpl();
