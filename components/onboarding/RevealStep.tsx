"use client";

import Link from "next/link";
import { getArchetype } from "@/lib/archetypes";
import { revealHandoffStorageKey } from "@/lib/handoff";
import type { ArchetypeMatch } from "@/lib/types";

type RevealStepProps = {
  match: ArchetypeMatch;
};

export function RevealStep({ match }: RevealStepProps) {
  const archetype = getArchetype(match.archetype);

  function persistHandoff() {
    window.sessionStorage.setItem(revealHandoffStorageKey, JSON.stringify(match));
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="surface p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--red)]">Archetype revealed</p>
        <h2 className="mt-3 text-5xl font-black text-slate-950">{archetype.name}</h2>
        <p className="mt-4 text-lg text-slate-600">{archetype.summary}</p>
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Confidence</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{Math.round(match.confidence * 100)}%</p>
          {match.isFallback ? (
            <p className="mt-2 text-sm text-slate-500">Local fallback match used until Vertex AI credentials are configured.</p>
          ) : null}
        </div>
      </div>

      <div className="surface p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <SportBlock label="Paralympic sport" value={match.sports.paralympic} emphasized />
          <SportBlock label="Olympic sport" value={match.sports.olympic} />
        </div>

        <div className="mt-6 space-y-3">
          {match.narrativeBeats.map((beat) => (
            <p key={beat} className="rounded-md border border-slate-200 bg-white p-4 text-slate-700">
              {beat}
            </p>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Link href={{ pathname: "/moment" }} onClick={persistHandoff} className="rounded-md bg-[var(--navy)] px-5 py-3 font-bold text-white">
            Continue
          </Link>
        </div>
      </div>
    </section>
  );
}

function SportBlock({
  label,
  value,
  emphasized = false
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`rounded-md border p-5 ${emphasized ? "border-[var(--red)] bg-red-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black capitalize text-slate-950">{value}</p>
    </div>
  );
}
