"use client";

import { useState } from "react";
import { quizQuestions } from "@/lib/quiz";
import type { QuizAnswers } from "@/lib/types";

type QuizStepProps = {
  initialAnswers: QuizAnswers;
  onComplete: (answers: QuizAnswers) => void;
};

export function QuizStep({ initialAnswers, onComplete }: QuizStepProps) {
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const isComplete = quizQuestions.every((question) => answers[question.id]);

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="surface p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--red)]">Vibe quiz</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-950">Pick on instinct.</h2>
        <p className="mt-4 text-slate-600">
          Eight quick choices become a structured signal for the archetype match.
        </p>
      </div>

      <div className="surface p-5 md:p-7">
        <div className="space-y-5">
          {quizQuestions.map((question, index) => (
            <fieldset key={question.id} className="rounded-md border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-500">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-3 grid gap-3 md:grid-cols-5">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`min-h-20 rounded-md border px-4 py-3 text-left text-sm font-bold transition md:text-base ${
                        selected
                          ? "border-[var(--blue)] bg-blue-50 text-blue-950 shadow-[0_0_0_3px_rgba(37,99,235,0.14)]"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                      }`}
                      aria-pressed={selected}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">{Object.keys(answers).length} of {quizQuestions.length} answered</p>
          <button
            type="button"
            disabled={!isComplete}
            className="rounded-md bg-[var(--navy)] px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => onComplete(answers)}
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}
