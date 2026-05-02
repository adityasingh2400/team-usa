import { NextResponse } from "next/server";
import { matchArchetype, userInputSchema } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

const matchRateLimit = {
  limit: 10,
  windowMs: 60_000
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`match:${clientKey}`, matchRateLimit);

  if (!rateLimit.allowed) {
    logMatchEvent({
      requestId,
      outcome: "rate_limited",
      latencyMs: Date.now() - startedAt,
      clientKey
    });
    return NextResponse.json(
      { error: "Too many match requests. Please wait a minute and try again.", requestId },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
          "X-Request-Id": requestId
        }
      }
    );
  }

  try {
    const json = await request.json();
    const input = userInputSchema.parse(json);
    const match = await matchArchetype(input);
    logMatchEvent({
      requestId,
      outcome: match.isFallback ? "fallback" : "gemini",
      latencyMs: Date.now() - startedAt,
      clientKey
    });
    return NextResponse.json(match, { headers: { "X-Request-Id": requestId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to match archetype";
    logMatchEvent({
      requestId,
      outcome: "error",
      latencyMs: Date.now() - startedAt,
      clientKey,
      error: message
    });
    return NextResponse.json({ error: message, requestId }, { status: 400, headers: { "X-Request-Id": requestId } });
  }
}

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

function logMatchEvent(event: {
  requestId: string;
  outcome: "gemini" | "fallback" | "error" | "rate_limited";
  latencyMs: number;
  clientKey: string;
  error?: string;
}) {
  console.info(JSON.stringify({
    event: "match_request",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    ...event
  }));
}
