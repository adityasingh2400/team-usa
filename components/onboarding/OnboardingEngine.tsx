"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { MeasurementStep, type MeasurementDraft } from "@/components/onboarding/MeasurementStep";
import { QuizStep } from "@/components/onboarding/QuizStep";
import { RevealStep } from "@/components/onboarding/RevealStep";
import type { ArchetypeMatch, ClientUserInput, QuizAnswers } from "@/lib/types";

const SilhouetteCapture = dynamic(
  () => import("@/components/onboarding/SilhouetteCapture").then((mod) => mod.SilhouetteCapture),
  {
    ssr: false,
    loading: () => (
      <div className="surface p-8 text-slate-600">
        Preparing camera tools...
      </div>
    )
  }
);

type Step = "quiz" | "measure" | "silhouette" | "loading" | "reveal";

export function OnboardingEngine() {
  const [step, setStep] = useState<Step>("quiz");
  const [quiz, setQuiz] = useState<QuizAnswers>({});
  const [measurements, setMeasurements] = useState<MeasurementDraft | null>(null);
  const [match, setMatch] = useState<ArchetypeMatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    const order: Step[] = ["quiz", "measure", "silhouette", "loading", "reveal"];
    return ((order.indexOf(step) + 1) / order.length) * 100;
  }, [step]);

  async function submitForMatch(capture: Pick<ClientUserInput, "silhouettePng" | "webcamStatus">) {
    if (!measurements) {
      setError("Measurements are required before matching.");
      setStep("measure");
      return;
    }

    setError(null);
    setStep("loading");

    const payload: ClientUserInput = {
      heightCm: measurements.heightCm,
      weightKg: measurements.weightKg,
      wingspanCm: measurements.wingspanCm,
      quiz,
      silhouettePng: capture.silhouettePng,
      webcamStatus: capture.webcamStatus
    };

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("The match service could not complete that request.");
      }

      const result = (await response.json()) as ArchetypeMatch;
      setMatch(result);
      setStep("reveal");
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "Something interrupted the match.");
      setStep("silhouette");
    }
  }

  return (
    <main className="min-h-screen py-6 md:py-10">
      <div className="step-shell">
        <header className="mb-7">
          <div className="meter-stripe h-2 w-full rounded-full" />
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Become Team USA</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-black text-slate-950 md:text-6xl">
                Find your movement archetype.
              </h1>
            </div>
            <div className="w-full md:w-64">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <div className="h-full rounded-full bg-[var(--red)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-500">Onboarding engine</p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        {step === "quiz" ? (
          <QuizStep
            initialAnswers={quiz}
            onComplete={(answers) => {
              setQuiz(answers);
              setStep("measure");
            }}
          />
        ) : null}

        {step === "measure" ? (
          <MeasurementStep
            initialMeasurements={measurements}
            onBack={() => setStep("quiz")}
            onComplete={(nextMeasurements) => {
              setMeasurements(nextMeasurements);
              setStep("silhouette");
            }}
          />
        ) : null}

        {step === "silhouette" ? (
          <SilhouetteCapture onBack={() => setStep("measure")} onComplete={submitForMatch} />
        ) : null}

        {step === "loading" ? <LoadingMatch /> : null}

        {step === "reveal" && match ? <RevealStep match={match} /> : null}
      </div>
    </main>
  );
}

function LoadingMatch() {
  return (
    <section className="surface grid min-h-[460px] place-items-center p-8 text-center">
      <div>
        <div className="mx-auto h-24 w-24 animate-pulse rounded-full border-8 border-[var(--blue)] border-t-[var(--gold)]" />
        <h2 className="mt-8 text-3xl font-bold text-slate-950">Analyzing your archetype...</h2>
        <p className="mt-3 max-w-xl text-slate-600">
          Measurements, quiz signals, and the optional silhouette are being translated into one movement profile.
        </p>
      </div>
    </section>
  );
}
