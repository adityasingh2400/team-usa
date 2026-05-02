export type ArchetypeId = "striker" | "flow" | "spring" | "aim" | "launch";

export type SportPairing = {
  olympic: string;
  paralympic: string;
};

export type ArchetypeMatch = {
  archetype: ArchetypeId;
  sports: SportPairing;
  narrativeBeats: string[];
  quizVector: number[];
  confidence: number;
  isFallback: boolean;
};

export type QuizAnswers = Record<string, string>;

export type UserInput = {
  heightCm: number;
  weightKg: number;
  wingspanCm?: number;
  quiz: QuizAnswers;
  silhouettePng?: string;
};

export type MeasurementUnits = "metric" | "imperial";

export type ClientUserInput = UserInput & {
  webcamStatus: "granted" | "denied" | "skipped";
};
