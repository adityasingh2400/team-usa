import type { ArchetypeMatch } from "@/lib/types";

export const revealHandoffStorageKey = "become-team-usa:archetype-match";

const archetypeIds = new Set(["striker", "flow", "spring", "aim", "launch"]);

export function isArchetypeMatch(value: unknown): value is ArchetypeMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ArchetypeMatch>;
  return (
    typeof candidate.archetype === "string" &&
    archetypeIds.has(candidate.archetype) &&
    Boolean(candidate.sports) &&
    typeof candidate.sports?.olympic === "string" &&
    typeof candidate.sports?.paralympic === "string" &&
    Array.isArray(candidate.narrativeBeats) &&
    candidate.narrativeBeats.every((beat) => typeof beat === "string") &&
    Array.isArray(candidate.quizVector) &&
    candidate.quizVector.every((entry) => typeof entry === "number") &&
    typeof candidate.confidence === "number" &&
    typeof candidate.isFallback === "boolean"
  );
}

export function parseStoredArchetypeMatch(serialized: string | null): ArchetypeMatch | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    return isArchetypeMatch(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
