import type { ArchetypeId, QuizAnswers } from "@/lib/types";

export type QuizWeights = {
  striker: number;
  flow: number;
  spring: number;
  aim: number;
  launch: number;
};

export type QuizOption = {
  id: string;
  label: string;
  weights: QuizWeights;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export const archetypeOrder: ArchetypeId[] = ["striker", "flow", "spring", "aim", "launch"];

const zeroWeights: QuizWeights = {
  striker: 0,
  flow: 0,
  spring: 0,
  aim: 0,
  launch: 0
};

function weightFor(archetype: ArchetypeId): QuizWeights {
  return { ...zeroWeights, [archetype]: 1 };
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "movement_chase",
    prompt: "When you move at your best, what are you chasing?",
    options: [
      { id: "split_second_opening", label: "The split second opening before it closes", weights: weightFor("striker") },
      { id: "smooth_rhythm", label: "A smooth rhythm that keeps carrying you", weights: weightFor("flow") },
      { id: "first_burst", label: "The first explosive burst off the line", weights: weightFor("spring") },
      { id: "clean_line", label: "The cleanest possible line to the target", weights: weightFor("aim") },
      { id: "powerful_release", label: "One powerful release after building force", weights: weightFor("launch") }
    ]
  },
  {
    id: "power_feel",
    prompt: "Your power feels most like...",
    options: [
      { id: "snap", label: "A snap", weights: weightFor("striker") },
      { id: "wave", label: "A wave", weights: weightFor("flow") },
      { id: "spark", label: "A spark", weights: weightFor("spring") },
      { id: "laser", label: "A laser", weights: weightFor("aim") },
      { id: "cannon", label: "A cannon", weights: weightFor("launch") }
    ]
  },
  {
    id: "pressure_trust",
    prompt: "In a high pressure moment, what would you trust most?",
    options: [
      { id: "quick_read", label: "Making the quick read", weights: weightFor("striker") },
      { id: "loose_flow", label: "Staying loose and flowing", weights: weightFor("flow") },
      { id: "first_move", label: "Beating everyone to the first move", weights: weightFor("spring") },
      { id: "calm_exact", label: "Staying calm enough to be exact", weights: weightFor("aim") },
      { id: "force_moment", label: "Creating force when it matters", weights: weightFor("launch") }
    ]
  },
  {
    id: "body_cue",
    prompt: "Which body cue feels most natural to you?",
    options: [
      { id: "quick_hands_shoulders", label: "Quick hands and shoulders", weights: weightFor("striker") },
      { id: "long_relaxed_reach", label: "Long relaxed reach", weights: weightFor("flow") },
      { id: "fast_legs_bounce", label: "Fast legs and bounce", weights: weightFor("spring") },
      { id: "steady_eyes_breath", label: "Steady eyes and controlled breath", weights: weightFor("aim") },
      { id: "hips_core_torque", label: "Hips, core, and full body torque", weights: weightFor("launch") }
    ]
  },
  {
    id: "training_pull",
    prompt: "What kind of training sounds most satisfying?",
    options: [
      { id: "reaction_drills", label: "Reaction drills and quick decisions", weights: weightFor("striker") },
      { id: "smooth_repetition", label: "Repeating a smooth motion until it feels effortless", weights: weightFor("flow") },
      { id: "sprint_jump_reps", label: "Sprint starts, jumps, and explosive reps", weights: weightFor("spring") },
      { id: "accuracy_details", label: "Accuracy reps where tiny details matter", weights: weightFor("aim") },
      { id: "heavy_release", label: "Heavy power reps with a huge release", weights: weightFor("launch") }
    ]
  },
  {
    id: "beautiful_movement",
    prompt: "What makes a movement look beautiful to you?",
    options: [
      { id: "chaos_timing", label: "Perfect timing in a chaotic moment", weights: weightFor("striker") },
      { id: "unforced_rhythm", label: "Smooth rhythm that never looks forced", weights: weightFor("flow") },
      { id: "speed_lift", label: "Pure speed and lift", weights: weightFor("spring") },
      { id: "quiet_precision", label: "Precision so clean it looks quiet", weights: weightFor("aim") },
      { id: "whole_body_force", label: "Force traveling through the whole body", weights: weightFor("launch") }
    ]
  },
  {
    id: "first_fix",
    prompt: "When something feels off, what would you fix first?",
    options: [
      { id: "timing", label: "My timing", weights: weightFor("striker") },
      { id: "rhythm", label: "My rhythm", weights: weightFor("flow") },
      { id: "explosiveness", label: "My explosiveness", weights: weightFor("spring") },
      { id: "control", label: "My control", weights: weightFor("aim") },
      { id: "power_path", label: "My power path", weights: weightFor("launch") }
    ]
  },
  {
    id: "signature_moment",
    prompt: "Pick the moment that sounds most like you.",
    options: [
      { id: "space_release", label: "Finding space and releasing at the perfect second", weights: weightFor("striker") },
      { id: "gliding_motion", label: "Gliding through motion without fighting it", weights: weightFor("flow") },
      { id: "launching_forward", label: "Launching forward before anyone reacts", weights: weightFor("spring") },
      { id: "steady_release", label: "Holding steady, then releasing cleanly", weights: weightFor("aim") },
      { id: "force_outward", label: "Building force and sending it outward", weights: weightFor("launch") }
    ]
  }
];

export function computeQuizVector(answers: QuizAnswers): number[] {
  const scores = Object.fromEntries(archetypeOrder.map((id) => [id, 0])) as Record<ArchetypeId, number>;

  for (const question of quizQuestions) {
    const option = question.options.find((candidate) => candidate.id === answers[question.id]);
    if (!option) {
      continue;
    }

    for (const archetype of archetypeOrder) {
      scores[archetype] += option.weights[archetype];
    }
  }

  const maxPossibleScore = quizQuestions.length;
  return archetypeOrder.map((id) => Number(Math.min(1, scores[id] / maxPossibleScore).toFixed(3)));
}

export const quizAnswersToVector = computeQuizVector;
