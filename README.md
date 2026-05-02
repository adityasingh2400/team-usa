# Become Team USA

This repository now contains the first playable slice of the Team USA x Google
Cloud hackathon entry: Shaurya's onboarding engine for the Athlete Archetype
Agent challenge.

The first rule of the repo still applies: raw athlete-level data should only be
processed by the final Google Cloud/Gemini pipeline. Public UI and committed
data stay aggregate-only.

## Current App

- Live Cloud Run demo: https://become-team-usa-822611143160.us-central1.run.app
- Next.js 15 App Router, React 19, TypeScript strict, Tailwind 4.
- Vibe quiz with typed config in `lib/quiz.ts`.
- Measurement input with metric/imperial conversion and validation.
- Optional webcam silhouette capture that uses browser BlazePose keypoints,
  draws an abstract black/white canvas PNG, and falls back to measurements when
  camera access is denied or skipped.
- `POST /api/match` route that returns the shared `ArchetypeMatch` contract.
- Gemini/Vertex AI provider hook with timeout, invalid JSON retry, compliance
  retry, and deterministic nearest-neighbor fallback.
- Reveal screen with Paralympic sport shown first and the Olympic sport given
  equivalent visual weight.
- `/moment` placeholder route for Aditya's handoff.

## Frontend Status

Only Shaurya's onboarding frontend is implemented right now: landing, quiz,
measurement input, optional silhouette capture, loading, and archetype reveal.
The post-reveal frontend is not built yet. Aditya still owns the moment engine,
pose-triggered sport videos, narrative screen, and share card.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Environment Variables

The app works locally without Vertex AI by using the deterministic fallback
matcher. To enable Gemini matching, configure Google auth and set:

```bash
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-pro
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

## Handoff To Aditya

Shaurya's owned flow ends when `RevealStep` receives a populated
`ArchetypeMatch` object from `/api/match`.

The shared contract lives in `lib/types.ts`:

- `ArchetypeMatch`
- `UserInput`
- `QuizAnswers`
- `SportPairing`
- `ArchetypeId`

Aditya should replace `app/moment/page.tsx` with the moment engine and consume
the reveal result from client state, URL/session storage, or a shared flow store.
Do not change `lib/types.ts` without coordinating because it is the handoff
boundary from `docs/plan/work-split.md`.

## Planning And Data Governance

- `docs/plan/become-team-usa-design-doc.md`: product, flow, stack, compliance,
  deadline, and demo priorities.
- `docs/plan/work-split.md`: ownership split, handoff boundary, shared types,
  and definition of done.
- `docs/data-sources.md`: curated source inventory with safety notes.
- `docs/compliance-notes.md`: NIL, IP, terminology, and output constraints.
- `docs/hackathon-faq-brief.md`: operational FAQ checklist for build decisions.
- `data/source-manifest.yml`: machine-readable list of candidate sources.
