import archetypeLookup from '@/data/archetype-lookup.json';
import type { ArchetypeId, ArchetypeMatch, UserInput } from '@/lib/types';

const CENTROIDS: Record<ArchetypeId, { heightCm: number; weightKg: number }> = {
  striker: { heightCm: 195, weightKg: 95 },
  flow:    { heightCm: 182, weightKg: 74 },
  spring:  { heightCm: 178, weightKg: 70 },
  aim:     { heightCm: 172, weightKg: 68 },
  launch:  { heightCm: 185, weightKg: 105 },
};

// Normalization ranges derived from Team USA physical data.
// Height: ~150–210 cm spread (60), Weight: ~50–130 kg spread (80).
const H_RANGE = 60;
const W_RANGE = 80;

function nearestCentroid(heightCm: number, weightKg: number): ArchetypeId {
  let nearest: ArchetypeId = 'flow';
  let minDist = Infinity;

  for (const [id, c] of Object.entries(CENTROIDS) as [ArchetypeId, typeof CENTROIDS[ArchetypeId]][]) {
    const dh = (heightCm - c.heightCm) / H_RANGE;
    const dw = (weightKg - c.weightKg) / W_RANGE;
    const dist = Math.hypot(dh, dw);
    if (dist < minDist) {
      minDist = dist;
      nearest = id;
    }
  }

  return nearest;
}

export function centroidFallback(input: UserInput): ArchetypeMatch {
  const archetypeId = nearestCentroid(input.heightCm, input.weightKg);
  const lookup = archetypeLookup.archetypes[archetypeId];

  const quizVector = [
    input.quiz.teamVsSolo,
    input.quiz.enduranceVsExplosive,
    input.quiz.precisionVsPower,
    input.quiz.waterVsLand,
    input.quiz.strategistVsReactor,
  ];

  return {
    archetype: archetypeId,
    sports: lookup.sports,
    narrativeBeats: [
      `Your inputs could align with ${lookup.sports.paralympic} pathways historically represented in Team USA.`,
      `This profile may be associated with the physical characteristics seen near ${lookup.sports.olympic} archetypes.`,
      `Profiles with these measurements have historically appeared near Team USA's ${lookup.sports.olympic} and ${lookup.sports.paralympic} families.`,
      `Your quiz responses could align with training patterns common across this sport archetype.`,
    ],
    quizVector,
    confidence: 0.5,
    isFallback: true,
  };
}
