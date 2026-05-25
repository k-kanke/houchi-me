import {
  buildEncounterPrompt,
  normalizeGeneratedEncounter,
} from '../_shared/clone-context.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import type { GeneratedEncounterPayload } from '../_shared/domain.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  createAuthedClient,
  fetchOwnedClone,
  fetchRecentTopics,
} from '../_shared/supabase.ts';

interface EncounterDialogueRequest {
  cloneId?: string;
  partnerName?: string;
  location?: string;
  save?: boolean;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const {
      cloneId,
      partnerName = 'Sage',
      location = '集会場',
      save = true,
    } = (await req.json()) as EncounterDialogueRequest;

    if (!cloneId) {
      return jsonResponse({ error: 'cloneId is required' }, 400);
    }

    const supabase = createAuthedClient(req);
    const clone = await fetchOwnedClone(supabase, cloneId);
    const topics = await fetchRecentTopics(supabase, cloneId, 3);
    const prompt = buildEncounterPrompt(clone, partnerName, location, topics);
    const generated = normalizeGeneratedEncounter(
      await generateJson<GeneratedEncounterPayload>(prompt),
    );

    if (save) {
      const { error } = await supabase.from('clone_encounters').insert({
        clone_id: cloneId,
        partner_name: partnerName,
        location,
        dialogue: generated.dialogue,
        cross_topic: generated.crossTopic,
      });
      if (error) {
        throw new Error(`Failed to save encounter: ${error.message}`);
      }
    }

    return jsonResponse(generated);
  } catch (error) {
    console.error('encounter-dialogue failed', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
