"use client";

import { FormEvent, useState } from "react";
import type { MeasurementUnits } from "@/lib/types";

export type MeasurementDraft = {
  heightCm: number;
  weightKg: number;
  wingspanCm?: number;
};

type MeasurementStepProps = {
  initialMeasurements: MeasurementDraft | null;
  onBack: () => void;
  onComplete: (measurements: MeasurementDraft) => void;
};

export function MeasurementStep({ initialMeasurements, onBack, onComplete }: MeasurementStepProps) {
  const [units, setUnits] = useState<MeasurementUnits>("imperial");
  const [heightCm, setHeightCm] = useState(String(initialMeasurements?.heightCm ?? 178));
  const [weightKg, setWeightKg] = useState(String(initialMeasurements?.weightKg ?? 75));
  const [wingspanCm, setWingspanCm] = useState(String(initialMeasurements?.wingspanCm ?? ""));
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("10");
  const [pounds, setPounds] = useState("165");
  const [wingspanInches, setWingspanInches] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const converted = units === "metric" ? readMetric() : readImperial();

    if (converted.heightCm < 90 || converted.heightCm > 240) {
      setError("Height needs to be between 90 cm and 240 cm.");
      return;
    }

    if (converted.weightKg < 25 || converted.weightKg > 250) {
      setError("Weight needs to be between 25 kg and 250 kg.");
      return;
    }

    if (converted.wingspanCm && (converted.wingspanCm < 80 || converted.wingspanCm > 260)) {
      setError("Wingspan needs to be between 80 cm and 260 cm.");
      return;
    }

    setError(null);
    onComplete(converted);
  }

  function readMetric(): MeasurementDraft {
    return {
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      wingspanCm: wingspanCm ? Number(wingspanCm) : undefined
    };
  }

  function readImperial(): MeasurementDraft {
    return {
      heightCm: Math.round((Number(feet) * 12 + Number(inches)) * 2.54),
      weightKg: Math.round(Number(pounds) * 0.453592),
      wingspanCm: wingspanInches ? Math.round(Number(wingspanInches) * 2.54) : undefined
    };
  }

  return (
    <section className="surface p-5 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--blue)]">Measurements</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Give the model the basics.</h2>
          <p className="mt-4 text-slate-600">
            These inputs guide archetype matching without making performance claims or comparing you to real athletes.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5 inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
            {(["imperial", "metric"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                className={`rounded px-4 py-2 text-sm font-bold capitalize ${
                  units === candidate ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => setUnits(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>

          {units === "metric" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField label="Height (cm)" value={heightCm} onChange={setHeightCm} />
              <NumberField label="Weight (kg)" value={weightKg} onChange={setWeightKg} />
              <NumberField label="Wingspan (cm)" value={wingspanCm} onChange={setWingspanCm} optional />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <NumberField label="Feet" value={feet} onChange={setFeet} />
              <NumberField label="Inches" value={inches} onChange={setInches} />
              <NumberField label="Weight (lb)" value={pounds} onChange={setPounds} />
              <NumberField label="Wingspan (in)" value={wingspanInches} onChange={setWingspanInches} optional />
            </div>
          )}

          {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="rounded-md border border-slate-300 px-5 py-3 font-bold" onClick={onBack}>
              Back
            </button>
            <button type="submit" className="rounded-md bg-[var(--navy)] px-5 py-3 font-bold text-white">
              Continue
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  optional = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">
        {label}
        {optional ? <span className="font-normal text-slate-400"> optional</span> : null}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950"
        inputMode="decimal"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
