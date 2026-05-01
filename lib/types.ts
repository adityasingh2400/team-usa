// Shared contract between Shaurya's onboarding slice and Aditya's moment engine.
// Changes to this file require coordination with both owners before merging.

export type ArchetypeId = 'striker' | 'flow' | 'spring' | 'aim' | 'launch';

export type SportPairing = {
  olympic: string;
  paralympic: string;
};

/** Five quiz dimensions mapped 0–1. Order matches quizVector in ArchetypeMatch. */
export type QuizAnswers = {
  /** 0 = solo competitor, 1 = team player */
  teamVsSolo: number;
  /** 0 = sustained endurance, 1 = explosive burst */
  enduranceVsExplosive: number;
  /** 0 = precision / technique, 1 = raw power */
  precisionVsPower: number;
  /** 0 = water / smooth surface, 1 = land / track / field */
  waterVsLand: number;
  /** 0 = strategist (reads the situation), 1 = reactor (trusts instinct) */
  strategistVsReactor: number;
};

export type UserInput = {
  heightCm: number;
  weightKg: number;
  wingspanCm?: number;
  quiz: QuizAnswers;
  /** Base64 PNG, 512×512. Silhouette rendered from MediaPipe keypoints — no raw pixels. */
  silhouettePng?: string;
  /** True when the user denied webcam access. Flow continues; silhouettePng stays undefined. */
  webcamDenied?: boolean;
};

export type ArchetypeMatch = {
  archetype: ArchetypeId;
  sports: SportPairing;
  /** 4–6 Gemini-generated narrative beats. No athlete names. Conditional phrasing only. */
  narrativeBeats: string[];
  /** Five-element vector mirroring QuizAnswers order. Used for narrative fuel and analytics. */
  quizVector: number[];
  /** 0–1. Reflects Gemini's confidence in the match. */
  confidence: number;
  /** True when centroid fallback was used instead of Gemini. Aditya renders a subtle badge. */
  isFallback: boolean;
};
