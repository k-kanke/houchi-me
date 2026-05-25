import { getSupabase } from '@/lib/supabase';
import type { Clone, Feedback, Message, Topic } from '@/types';

export interface Storage {
  getClone(): Promise<Clone | null>;
  saveClone(clone: Clone): Promise<void>;
  clearClone(): Promise<void>;
  getTopics(): Promise<Topic[]>;
  getTodaysTopic(dateKey: string): Promise<Topic | null>;
  saveTopic(topic: Topic): Promise<void>;
  getFeedback(): Promise<Record<string, Feedback>>;
  saveFeedback(feedback: Feedback): Promise<void>;
  getMessages(): Promise<Message[]>;
  appendMessage(message: Message): Promise<void>;
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
      .single();
    return data?.id ?? null;
  }

  async getClone(): Promise<Clone | null> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) return null;
    const { data } = await getSupabase()
      .from('clones')
      .select('*')
      .eq('user_id', user.id)
      .single();
    return data ? rowToClone(data as Record<string, unknown>) : null;
  }

  async saveClone(clone: Clone): Promise<void> {
    const user = await this.ensureUser();
    await getSupabase().from('clones').upsert({
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
  }

  async clearClone(): Promise<void> {
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
      .single();
    return data ? rowToTopic(data as Record<string, unknown>) : null;
  }

  async saveTopic(topic: Topic): Promise<void> {
    const cloneId = await this.fetchCloneId();
    if (!cloneId) return;
    await getSupabase().from('topics').upsert({
      id: topic.id,
      clone_id: cloneId,
      date_key: topic.dateKey,
      title: topic.title,
      reasoning: topic.reasoning,
      exploration_path: topic.explorationPath,
      related_concepts: topic.relatedConcepts,
    });
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
    await getSupabase().from('feedback').upsert({
      topic_id: feedback.topicId,
      kind: feedback.kind,
    });
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
    await getSupabase().from('messages').insert({
      id: message.id,
      clone_id: cloneId,
      role: message.role,
      text: message.text,
    });
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
    await getSupabase().from('clones').update(updates).eq('user_id', user.id);
    return this.getClone();
  }
}

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const storage: Storage = isSupabaseConfigured
  ? new SupabaseImpl()
  : new LocalStorageImpl();
