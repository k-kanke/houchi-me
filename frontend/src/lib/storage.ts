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

export const storage: Storage = new LocalStorageImpl();
