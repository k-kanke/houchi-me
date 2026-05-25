import {
  buildDailyAnswersPrompt,
  normalizeGeneratedDailyAnswers,
} from '../_shared/clone-context.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import type {
  DailyAnswerInput,
  GeneratedDailyAnswerPayload,
} from '../_shared/domain.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  createAuthedClient,
  fetchDailyQuestions,
  fetchOwnedClone,
} from '../_shared/supabase.ts';

interface ApplyDailyAnswersRequest {
  cloneId?: string;
  answers?: DailyAnswerInput[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { cloneId, answers = [] } = (await req.json()) as ApplyDailyAnswersRequest;
    const normalizedAnswers = answers.filter(
      (answer) => answer.questionKey?.trim() && answer.answer?.trim(),
    );

    if (!cloneId || normalizedAnswers.length === 0) {
      return jsonResponse({ error: 'cloneId and answers are required' }, 400);
    }

    const supabase = createAuthedClient(req);
    const clone = await fetchOwnedClone(supabase, cloneId);
    const questions = await fetchDailyQuestions(
      supabase,
      normalizedAnswers.map((answer) => answer.questionKey),
    );
    const prompt = buildDailyAnswersPrompt(clone, normalizedAnswers, questions);
    const generated = normalizeGeneratedDailyAnswers(
      await generateJson<GeneratedDailyAnswerPayload>(prompt),
    );

    const now = new Date().toISOString();
    const answerRows = normalizedAnswers
      .map((answer) => {
        const question = questions.find((item) => item.question_key === answer.questionKey);
        if (!question) return null;
        return {
          clone_id: cloneId,
          question_id: question.id,
          answer: answer.answer.trim(),
          answered_at: now,
        };
      })
      .filter((row) => row !== null);

    if (answerRows.length > 0) {
      const { error: answersError } = await supabase
        .from('daily_question_answers')
        .insert(answerRows);
      if (answersError) {
        throw new Error(`Failed to save daily answers: ${answersError.message}`);
      }
    }

    const currentVitals = {
      focus: Number(clone.vitals?.focus ?? 62),
      energy: Number(clone.vitals?.energy ?? 58),
      curiosity: Number(clone.vitals?.curiosity ?? 71),
    };

    const nextSyncRate = clamp(
      Number(clone.sync_rate) + Number(generated.syncRateDelta),
      0,
      100,
    );
    const nextVitals = {
      focus: clamp(generated.vitals.focus || currentVitals.focus, 0, 100),
      energy: clamp(generated.vitals.energy || currentVitals.energy, 0, 100),
      curiosity: clamp(generated.vitals.curiosity || currentVitals.curiosity, 0, 100),
    };

    const updates: Record<string, unknown> = {
      sync_rate: nextSyncRate,
      vitals: nextVitals,
    };

    if (generated.explorationType) {
      updates.exploration_type = generated.explorationType;
    }
    if (generated.personalityShift) {
      updates.personality_shift = generated.personalityShift;
    }

    const { error: cloneError } = await supabase
      .from('clones')
      .update(updates)
      .eq('id', cloneId);
    if (cloneError) {
      throw new Error(`Failed to update clone: ${cloneError.message}`);
    }

    return jsonResponse({
      syncRate: nextSyncRate,
      vitals: nextVitals,
      explorationType: generated.explorationType ?? clone.exploration_type,
      personalityShift: generated.personalityShift ?? clone.personality_shift,
      summary: generated.summary,
    });
  } catch (error) {
    console.error('apply-daily-answers failed', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
