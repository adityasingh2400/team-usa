import { z } from "zod";
import { fallbackMatch } from "@/lib/archetypes";
import { assertCompliantText, scanTextForCompliance } from "@/lib/compliance";
import { quizAnswersToVector } from "@/lib/quiz";
import type { ArchetypeMatch, UserInput } from "@/lib/types";

const archetypeIdSchema = z.enum(["striker", "flow", "spring", "aim", "launch"]);

export const userInputSchema = z.object({
  heightCm: z.number().min(90).max(240),
  weightKg: z.number().min(25).max(250),
  wingspanCm: z.number().min(80).max(260).optional(),
  quiz: z.record(z.string()),
  silhouettePng: z.string().startsWith("data:image/png;base64,").optional(),
  webcamStatus: z.enum(["granted", "denied", "skipped"]).optional()
});

export const archetypeMatchSchema = z.object({
  archetype: archetypeIdSchema,
  sports: z.object({
    olympic: z.string().min(2),
    paralympic: z.string().min(2)
  }),
  narrativeBeats: z.array(z.string().min(8)).min(4).max(6),
  quizVector: z.array(z.number()).length(5),
  confidence: z.number().min(0).max(1),
  isFallback: z.boolean()
});

type ProviderResponse = string | ArchetypeMatch;

export type GeminiProvider = (input: UserInput, prompt: string) => Promise<ProviderResponse>;

type MatchOptions = {
  provider?: GeminiProvider;
  timeoutMs?: number;
};

const defaultTimeoutMs = 15_000;

export async function matchArchetype(input: UserInput, options: MatchOptions = {}): Promise<ArchetypeMatch> {
  const parsedInput = userInputSchema.parse(input);
  const provider = options.provider ?? createVertexProvider();
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;

  if (!provider) {
    return fallbackMatch(parsedInput);
  }

  const prompt = buildMatchPrompt(parsedInput);

  try {
    const first = await runWithTimeout(provider(parsedInput, prompt), timeoutMs);
    return parseAndValidateProviderResponse(first, parsedInput);
  } catch (error) {
    if (isComplianceError(error)) {
      try {
        const retry = await runWithTimeout(provider(parsedInput, `${prompt}\n\nRevise once for compliance.`), timeoutMs);
        return parseAndValidateProviderResponse(retry, parsedInput);
      } catch {
        return fallbackMatch(parsedInput);
      }
    }

    if (isParseError(error)) {
      try {
        const retry = await runWithTimeout(provider(parsedInput, `${prompt}\n\nReturn only valid JSON.`), timeoutMs);
        return parseAndValidateProviderResponse(retry, parsedInput);
      } catch {
        return fallbackMatch(parsedInput);
      }
    }

    return fallbackMatch(parsedInput);
  }
}

function parseAndValidateProviderResponse(response: ProviderResponse, input: UserInput): ArchetypeMatch {
  const parsedJson = providerResponseSchema.parse(typeof response === "string" ? parseJson(response) : response);
  const candidate = archetypeMatchSchema.parse({
    ...parsedJson,
    quizVector: parsedJson.quizVector?.length === 5 ? parsedJson.quizVector : quizAnswersToVector(input.quiz),
    isFallback: false
  });

  assertCompliantText(JSON.stringify(candidate));
  return candidate;
}

const providerResponseSchema = z.object({
  archetype: archetypeIdSchema,
  sports: z.object({
    olympic: z.string(),
    paralympic: z.string()
  }),
  narrativeBeats: z.array(z.string()),
  quizVector: z.array(z.number()).optional(),
  confidence: z.number(),
  isFallback: z.boolean().optional()
});

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    const parseError = new Error("Invalid JSON returned by Gemini");
    parseError.cause = error;
    parseError.name = "GeminiParseError";
    throw parseError;
  }
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error("Gemini match timed out");
      error.name = "GeminiTimeoutError";
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function isParseError(error: unknown): boolean {
  return error instanceof Error && (error.name === "GeminiParseError" || error instanceof z.ZodError);
}

function isComplianceError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("compliance");
}

function buildMatchPrompt(input: UserInput): string {
  return `You are matching a fan to one movement archetype for a Team USA x Google Cloud hackathon demo.

Compliance rules:
- Do not name real athletes.
- Do not mention athlete likeness, photos, or protected marks.
- Use conditional phrasing such as "could align with" or "may be associated with".
- Keep Paralympic and Olympic sports equally prominent.
- Do not claim the user will be good at a sport.

Return only JSON matching this schema:
{
  "archetype": "striker|flow|spring|aim|launch",
  "sports": { "olympic": "string", "paralympic": "string" },
  "narrativeBeats": ["4 to 6 short compliant strings"],
  "quizVector": [number, number, number, number, number],
  "confidence": number,
  "isFallback": false
}

User input:
${JSON.stringify(
  {
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    wingspanCm: input.wingspanCm,
    quiz: input.quiz,
    hasSilhouette: Boolean(input.silhouettePng)
  },
  null,
  2
)}`;
}

function createVertexProvider(): GeminiProvider | undefined {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";

  if (!project) {
    return undefined;
  }

  return async (input, prompt) => {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project, location });
    const generativeModel = vertexAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json"
      }
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
    if (input.silhouettePng) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: input.silhouettePng.replace("data:image/png;base64,", "")
        }
      });
    }

    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts }]
    });
    const text = result.response.candidates?.[0]?.content.parts?.map((part) => "text" in part ? part.text : "").join("") ?? "";
    const compliance = scanTextForCompliance(text);
    if (!compliance.ok) {
      throw new Error(`Gemini output failed compliance scan: ${compliance.matches.join(", ")}`);
    }
    return text;
  };
}
