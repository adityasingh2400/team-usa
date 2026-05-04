"use client";

import { useEffect, useState } from "react";
import { parseStoredArchetypeMatch } from "@/lib/handoff";
import type { ArchetypeMatch } from "@/lib/types";

export default function MomentPage() {
  const [match, setMatch] = useState<ArchetypeMatch | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("become-team-usa:archetype-match");
    setMatch(parseStoredArchetypeMatch(stored));
  }, []);

  return (
    <main className="min-h-screen py-10">
      <div className="step-shell">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Received from Shaurya</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 md:text-6xl">Your moment is coming.</h1>
        {match ? (
          <p className="mt-6 text-xl text-slate-600">
            Archetype: <span className="font-bold capitalize">{match.archetype}</span>
          </p>
        ) : null}
        <p className="mt-4 text-slate-500">Aditya&apos;s moment engine goes here.</p>
      </div>
    </main>
  );
}
