import {
  buildParseCommandPrompt,
  normalizeParsedCloneCommand,
} from '../_shared/clone-context.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import type { ParsedCloneCommandPayload } from '../_shared/domain.ts';
import { generateJson } from '../_shared/gemini.ts';
import { createAuthedClient, fetchOwnedClone } from '../_shared/supabase.ts';

interface ParseCloneCommandRequest {
  cloneId?: string;
  commandText?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { cloneId, commandText } = (await req.json()) as ParseCloneCommandRequest;
    if (!cloneId || !commandText?.trim()) {
      return jsonResponse({ error: 'cloneId and commandText are required' }, 400);
    }

    const supabase = createAuthedClient(req);
    const clone = await fetchOwnedClone(supabase, cloneId);
    const prompt = buildParseCommandPrompt(clone, commandText.trim());
    const parsed = normalizeParsedCloneCommand(
      await generateJson<ParsedCloneCommandPayload>(prompt),
    );

    return jsonResponse(parsed);
  } catch (error) {
    console.error('parse-clone-command failed', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
