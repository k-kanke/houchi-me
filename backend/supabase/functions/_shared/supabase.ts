import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { CloneRecord, MessageRecord, TopicRecord } from './domain.ts';

function getSupabaseUrl(req: Request): string {
  return (
    Deno.env.get('SUPABASE_URL') ??
    Deno.env.get('LOCAL_SUPABASE_URL') ??
    new URL(req.url).origin
  );
}

function getSupabaseApiKey(req: Request): string {
  const headerKey = req.headers.get('apikey');
  if (headerKey) return headerKey;

  const envKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('LOCAL_SUPABASE_ANON_KEY');
  if (envKey) return envKey;

  throw new Error('Missing Supabase anon/publishable key');
}

export function createAuthedClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  return createClient(
    getSupabaseUrl(req),
    getSupabaseApiKey(req),
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    },
  );
}

export async function fetchOwnedClone(
  supabase: SupabaseClient,
  cloneId: string,
): Promise<CloneRecord> {
  const { data, error } = await supabase
    .from('clones')
    .select('*')
    .eq('id', cloneId)
    .single();

  if (error || !data) {
    throw new Error('Clone not found or not accessible');
  }

  return data as CloneRecord;
}

export async function fetchRecentTopics(
  supabase: SupabaseClient,
  cloneId: string,
  limit = 8,
): Promise<TopicRecord[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('clone_id', cloneId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load topics: ${error.message}`);
  }

  return (data ?? []) as TopicRecord[];
}

export async function fetchTopicByDate(
  supabase: SupabaseClient,
  cloneId: string,
  dateKey: string,
): Promise<TopicRecord | null> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('clone_id', cloneId)
    .eq('date_key', dateKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load topic: ${error.message}`);
  }

  return (data as TopicRecord | null) ?? null;
}

export async function fetchRecentMessages(
  supabase: SupabaseClient,
  cloneId: string,
  limit = 12,
): Promise<MessageRecord[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('clone_id', cloneId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return ((data ?? []) as MessageRecord[]).reverse();
}

export async function fetchDailyQuestions(
  supabase: SupabaseClient,
  questionKeys: string[],
): Promise<Array<{ id: string; question_key: string; text: string; sort_order: number }>> {
  const { data, error } = await supabase
    .from('daily_questions')
    .select('id, question_key, text, sort_order')
    .in('question_key', questionKeys)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load daily questions: ${error.message}`);
  }

  return (data ?? []) as Array<{ id: string; question_key: string; text: string; sort_order: number }>;
}
