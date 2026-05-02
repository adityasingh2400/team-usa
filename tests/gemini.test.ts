import { describe, expect, it } from "vitest";
import { matchArchetype, type GeminiProvider } from "@/lib/gemini";
import type { UserInput } from "@/lib/types";

const input: UserInput = {
  heightCm: 183,
  weightKg: 82,
  wingspanCm: 190,
  quiz: {
    element: "fire",
    edge: "sharp",
    tempo: "fast",
    power: "explosion",
    mind: "focus"
  }
};

const validGeminiResponse = JSON.stringify({
  archetype: "striker",
  sports: {
    olympic: "basketball",
    paralympic: "wheelchair basketball"
  },
  narrativeBeats: [
    "Your inputs could align with quick court reads.",
    "Wheelchair basketball and basketball are treated with equal analytical depth.",
    "This profile may be associated with repeat acceleration.",
    "The match stays conditional and aggregate."
  ],
  quizVector: [1, 0.2, 0.4, 0.3, 0.5],
  confidence: 0.78,
  isFallback: false
});

describe("matchArchetype", () => {
  it("falls back when the provider times out", async () => {
    const provider: GeminiProvider = () => new Promise(() => undefined);

    const result = await matchArchetype(input, { provider, timeoutMs: 5 });

    expect(result.isFallback).toBe(true);
    expect(result.narrativeBeats.length).toBeGreaterThanOrEqual(4);
  });

  it("retries once after invalid JSON", async () => {
    let calls = 0;
    const provider: GeminiProvider = async () => {
      calls += 1;
      return calls === 1 ? "not-json" : validGeminiResponse;
    };

    const result = await matchArchetype(input, { provider, timeoutMs: 50 });

    expect(calls).toBe(2);
    expect(result.isFallback).toBe(false);
    expect(result.archetype).toBe("striker");
  });

  it("uses nearest-neighbor fallback when no provider is configured", async () => {
    const result = await matchArchetype(input, { provider: undefined, timeoutMs: 50 });

    expect(result.isFallback).toBe(true);
    expect(result.sports.paralympic).toBeTruthy();
    expect(result.quizVector).toHaveLength(5);
  });
});
