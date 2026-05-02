import lookup from "@/public/data/archetype-lookup.json";
import type { ArchetypeId, ArchetypeMatch, SportPairing, UserInput } from "@/lib/types";
import { archetypeOrder, quizAnswersToVector } from "@/lib/quiz";

export type ArchetypeRecord = {
  id: ArchetypeId;
  name: string;
  summary: string;
  sports: SportPairing;
  measurementProfile: {
    heightCm: number;
    weightKg: number;
    wingspanCm?: number;
  };
  quizBias: number[];
  aggregateFacts: string[];
  narrativeBeats: string[];
};

export const archetypes = lookup.archetypes as ArchetypeRecord[];

export function getArchetype(id: ArchetypeId): ArchetypeRecord {
  const record = archetypes.find((candidate) => candidate.id === id);
  if (!record) {
    throw new Error(`Unknown archetype: ${id}`);
  }
  return record;
}

export function fallbackMatch(input: UserInput): ArchetypeMatch {
  const quizVector = quizAnswersToVector(input.quiz);
  const scored = archetypes.map((record) => {
    const heightDistance = Math.abs(input.heightCm - record.measurementProfile.heightCm) / 35;
    const weightDistance = Math.abs(input.weightKg - record.measurementProfile.weightKg) / 35;
    const wingspanDistance =
      input.wingspanCm && record.measurementProfile.wingspanCm
        ? Math.abs(input.wingspanCm - record.measurementProfile.wingspanCm) / 40
        : 0.2;
    const quizDistance = record.quizBias.reduce((sum, bias, index) => sum + Math.abs(bias - quizVector[index]), 0);

    return {
      record,
      score: heightDistance + weightDistance + wingspanDistance + quizDistance
    };
  });

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0]?.record ?? getArchetype(archetypeOrder[0]);
  const confidence = Math.max(0.42, Math.min(0.72, 0.82 - (scored[0]?.score ?? 0) / 10));

  return {
    archetype: best.id,
    sports: best.sports,
    narrativeBeats: best.narrativeBeats,
    quizVector,
    confidence: Number(confidence.toFixed(2)),
    isFallback: true
  };
}
