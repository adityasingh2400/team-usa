import { describe, expect, it } from "vitest";
import { parseStoredArchetypeMatch } from "@/lib/handoff";

describe("parseStoredArchetypeMatch", () => {
  it("returns a match for the persisted reveal handoff", () => {
    const match = parseStoredArchetypeMatch(JSON.stringify({
      archetype: "flow",
      sports: {
        olympic: "swimming",
        paralympic: "para swimming"
      },
      narrativeBeats: ["This profile could align with repeat rhythm."],
      quizVector: [0, 1, 0, 1, 0],
      confidence: 0.64,
      isFallback: false
    }));

    expect(match?.archetype).toBe("flow");
  });

  it("returns null for malformed stored data", () => {
    expect(parseStoredArchetypeMatch("{nope")).toBeNull();
    expect(parseStoredArchetypeMatch(JSON.stringify({ archetype: "named-athlete" }))).toBeNull();
  });
});
