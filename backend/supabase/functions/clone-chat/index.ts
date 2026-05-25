import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { buildChatPrompt } from '../_shared/clone-context.ts';
import { generateText } from '../_shared/gemini.ts';
import {
  createAuthedClient,
  fetchRecentEncounters,
  fetchOwnedClone,
  fetchRecentMessages,
  fetchRecentTopics,
} from '../_shared/supabase.ts';

interface CloneChatRequest {
  cloneId?: string;
  userText?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { cloneId, userText } = (await req.json()) as CloneChatRequest;
    if (!cloneId || !userText?.trim()) {
      return jsonResponse({ error: 'cloneId and userText are required' }, 400);
    }

    const supabase = createAuthedClient(req);
    const clone = await fetchOwnedClone(supabase, cloneId);
    const topics = await fetchRecentTopics(supabase, cloneId, 3);
    const encounters = await fetchRecentEncounters(supabase, cloneId, 5);
    const messages = await fetchRecentMessages(supabase, cloneId, 12);
    const prompt = buildChatPrompt(clone, topics, encounters, messages, userText.trim());
    const reply = await generateText(prompt);
    const { error: messageError } = await supabase.from('messages').insert([
      {
        clone_id: cloneId,
        role: 'user',
        text: userText.trim(),
      },
      {
        clone_id: cloneId,
        role: 'clone',
        text: reply,
      },
    ]);
    if (messageError) {
      throw new Error(`Failed to save messages: ${messageError.message}`);
    }

    return jsonResponse({ reply });
  } catch (error) {
    console.error('clone-chat failed', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
