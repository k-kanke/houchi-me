interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

type ResponseJsonSchema = Record<string, unknown>;

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'models/gemini-2.5-flash';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function extractText(response: GeminiResponse): string {
  const text = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

function parseJsonText<T>(text: string): T {
  const normalized = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(normalized) as T;
}

async function callGemini(body: Record<string, unknown>): Promise<GeminiResponse> {
  const apiKey = requireEnv('GEMINI_API_KEY');
  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as GeminiResponse;
}

export async function generateText(input: {
  systemInstruction: string;
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}): Promise<string> {
  const response = await callGemini({
    systemInstruction: {
      parts: [{ text: input.systemInstruction }],
    },
    contents: input.contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    },
  });

  return extractText(response);
}

export async function generateJson<T>(input: {
  systemInstruction: string;
  userPrompt: string;
  responseJsonSchema?: ResponseJsonSchema;
}): Promise<T> {
  const systemInstruction = [
    input.systemInstruction,
    '必ず妥当な JSON だけを返してください。',
    '文字列中に生の改行を入れず、必要なら \\n を使ってください。',
    'JSON の前後に説明文、コードフェンス、注釈を付けないでください。',
  ].join('\n');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await callGemini({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: input.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        ...(input.responseJsonSchema
          ? { responseJsonSchema: input.responseJsonSchema }
          : {}),
      },
    });

    const text = extractText(response);

    try {
      return parseJsonText<T>(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to parse Gemini JSON response', {
        attempt: attempt + 1,
        text,
        message: lastError.message,
      });
    }
  }

  throw lastError ?? new Error('Failed to parse Gemini JSON response');
}
