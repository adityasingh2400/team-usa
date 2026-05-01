import { SchemaType, VertexAI } from '@google-cloud/vertexai';
import { z } from 'zod';
import { centroidFallback } from '@/lib/fallback';
import type { ArchetypeMatch, UserInput } from '@/lib/types';

const PROJECT = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION ?? 'us-central1';
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-pro';
const TIMEOUT_MS = 12_000;

// Lazy-init: don't blow up at import time if env vars are missing in dev.
function getVertex(): VertexAI {
  if (!PROJECT) throw new Error('GCP_PROJECT_ID env var is required');
  return new VertexAI({ project: PROJECT, location: LOCATION });
}

const SYSTEM_PREAMBLE = `You are a sports archetype classifier for a Team USA fan experience.

COMPLIANCE RULES — follow exactly:
- Do NOT output any athlete name, image description, or individual likeness.
- Do NOT make performance promises or use language like "you will be good at" or "you are a natural".
- Use conditional language only: "could align with", "may be associated with", "historically appears near".
- Olympic and Paralympic sport pairings must receive equal narrative weight.
- Paralympic sport must appear first in the narrativeBeats array.
- Do NOT reference finish times, specific scores, or individual competition results.
- Do NOT use the phrase "former Olympian" or "former Paralympian".
- Do NOT use NGB names (e.g., "USA Swimming"). Use generic sport names (e.g., "swimming").
- Do NOT output any USOPC, IOC, or LA28 branding or logo descriptions.
- isFallback must always be false. The API sets it to true only when using the fallback path.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  required: ['archetype', 'olympicSport', 'paralympicSport', 'narrativeBeats', 'quizVector', 'confidence', 'isFallback'] as string[],
  properties: {
    archetype: {
      type: SchemaType.STRING,
      enum: ['striker', 'flow', 'spring', 'aim', 'launch'],
    },
    olympicSport:    { type: SchemaType.STRING },
    paralympicSport: { type: SchemaType.STRING },
    narrativeBeats: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      minItems: 4,
      maxItems: 6,
    },
    quizVector: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.NUMBER },
      minItems: 5,
      maxItems: 5,
    },
    confidence: {
      type: SchemaType.NUMBER,
      minimum: 0,
      maximum: 1,
    },
    isFallback: { type: SchemaType.BOOLEAN },
  },
};

const GeminiResponseSchema = z.object({
  archetype: z.enum(['striker', 'flow', 'spring', 'aim', 'launch']),
  olympicSport:    z.string().min(1),
  paralympicSport: z.string().min(1),
  narrativeBeats:  z.array(z.string().min(1)).min(4).max(6),
  quizVector:      z.array(z.number()).length(5),
  confidence:      z.number().min(0).max(1),
  isFallback:      z.boolean(),
});

class TimeoutError extends Error {
  constructor() { super('TIMEOUT'); }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError()), ms)
    ),
  ]);
}

function buildUserParts(input: UserInput) {
  const lines = [
    'Classify this user into one of five Team USA archetypes.',
    '',
    'Physical inputs:',
    `- Height: ${input.heightCm} cm`,
    `- Weight: ${input.weightKg} kg`,
    ...(input.wingspanCm ? [`- Wingspan: ${input.wingspanCm} cm`] : []),
    '',
    'Quiz vector (each value 0.0–1.0):',
    `- teamVsSolo: ${input.quiz.teamVsSolo}`,
    `- enduranceVsExplosive: ${input.quiz.enduranceVsExplosive}`,
    `- precisionVsPower: ${input.quiz.precisionVsPower}`,
    `- waterVsLand: ${input.quiz.waterVsLand}`,
    `- strategistVsReactor: ${input.quiz.strategistVsReactor}`,
    '',
    'Archetypes and centroids:',
    '- striker: basketball / wheelchair basketball. Centroid: 195 cm / 95 kg.',
    '- flow: swimming / para swimming. Centroid: 182 cm / 74 kg.',
    '- spring: track and field sprints / para athletics sprints. Centroid: 178 cm / 70 kg.',
    '- aim: archery / para archery. Centroid: 172 cm / 68 kg.',
    '- launch: shot put and throws / para shot put and throws. Centroid: 185 cm / 105 kg.',
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [{ text: lines.join('\n') }];

  if (input.silhouettePng) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: input.silhouettePng,
      },
    });
  }

  return parts;
}

async function callGemini(input: UserInput): Promise<ArchetypeMatch> {
  const model = getVertex().preview.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PREAMBLE }],
    },
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: buildUserParts(input) }],
  });

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');

  const parsed = GeminiResponseSchema.parse(JSON.parse(text));

  return {
    archetype: parsed.archetype,
    sports: { olympic: parsed.olympicSport, paralympic: parsed.paralympicSport },
    narrativeBeats: parsed.narrativeBeats,
    quizVector: parsed.quizVector,
    confidence: parsed.confidence,
    isFallback: false,
  };
}

/**
 * Match a user to a Team USA archetype via Vertex AI Gemini.
 *
 * Fallback contract:
 * - Timeout (>12s)          → centroid fallback immediately, no retry.
 * - JSON/Zod parse failure  → retry once, then centroid fallback.
 */
export async function matchArchetype(input: UserInput): Promise<ArchetypeMatch> {
  // Attempt 1
  try {
    return await withTimeout(callGemini(input), TIMEOUT_MS);
  } catch (e) {
    if (e instanceof TimeoutError) {
      return centroidFallback(input);
    }
    // Parse failure — fall through to retry
  }

  // Attempt 2 (retry on parse failure only)
  try {
    return await withTimeout(callGemini(input), TIMEOUT_MS);
  } catch {
    return centroidFallback(input);
  }
}
