# Work Split — Aditya + Shuarya

10 days, 2 builders. Not split by frontend/backend — in an AI-assisted world
everyone does everything. Split by **user-facing feature area**. Each owner
carries their feature end-to-end (UI + API + prompts + data).

## Ownership at a glance

- **Shuarya:** the onboarding engine. Quiz + measurement input + webcam
  silhouette capture + archetype matching (the Gemini call). Owns everything
  from "user lands" to "archetype revealed."
- **Aditya:** the moment engine + everything after. Pose trigger + video
  player + slo-mo choreography + narrative + share card. Owns everything from
  "archetype revealed" to "user shares."
- **Shared:** infra, data pipeline, compliance, demo video. See "Shared"
  section.

Both builders use Cursor + Claude Code. Both write frontend and backend.
Pair on hard parts. Trade help freely.

## The natural handoff point

```
 Shuarya's turf                         Aditya's turf
 ─────────────────────────────►        ─────────────────────────────►

 [Landing]   [Quiz]   [Measure+    [Archetype    [Paralympic    [Olympic    [Narrative]   [Share]
                      Silhouette]   Reveal]       Moment]       Moment]
                           │                         │             │            │           │
                           └─── /api/match ──┐      └──/api/... ──┴────────────┘           │
                                             │                                              │
                                             ▼                                              ▼
                                        Gemini 2.5 Pro                              /api/share-card
                                        (multimodal + reasoning)                    /api/narrative
```

Clean boundary: the `ArchetypeMatch` TypeScript type. Shuarya produces it.
Aditya consumes it. Agreed upfront, versioned in `lib/types.ts`.

## Shuarya — Onboarding Engine

**Feature:** user arrives, takes a short vibe quiz, enters measurements,
captures a silhouette, gets revealed as an archetype. End state: the reveal
screen is displayed with a populated `ArchetypeMatch` object.

### Tasks

**Scaffolding and data**
- [ ] Next.js 15 App Router scaffold with Tailwind, TypeScript strict, ESLint
- [ ] ETL script that parses 2024 Olympic + Paralympic roster XLSXs, filters
  to Team USA only, aggregates sport × state counts, writes
  `public/data/archetype-lookup.json` (<50KB, aggregate only, no names)
- [ ] Athlete-name extractor writes `.compliance/athlete-names.txt`
  (gitignored) from roster full-name columns
- [ ] Hand-curated archetype × sport mapping (5 archetypes, 10 sports) baked
  into archetype-lookup.json, with Gemini-written justifications as a
  build-time script
- [ ] `lib/types.ts` with `ArchetypeMatch`, `UserInput`, `QuizAnswers`
  (hand off to Aditya early; this is the shared contract)

**The vibe quiz**
- [ ] Quiz screen component. 4-6 playful forced-choice questions:
  "water or fire?", "smooth or sharp?", "fast or heavy?", "rhythm or
  explosion?", "focus or flow?". Each answer is a vector that biases the
  archetype match. Feels like BuzzFeed fun; works as structured input to
  Gemini.
- [ ] Quiz questions live in a typed config (`lib/quiz.ts`), easy to iterate
- [ ] Answers serialize to a `QuizAnswers` object passed to the match API

**Measurement + silhouette capture**
- [ ] Measurement form: height (cm or ft/in), weight (kg or lb),
  optional wingspan. Zod validation. Handles unit toggling.
- [ ] Webcam permission flow with friendly fallback copy when denied
- [ ] MediaPipe BlazePose lazy-loaded on this step only (via `next/dynamic`,
  SSR off)
- [ ] One-shot silhouette capture: user presses a button, system captures a
  single frame, renders it as a silhouette (keypoints → shape, no face), sends
  the silhouette PNG (resized to 512×512) with the API call
- [ ] If webcam denied: proceed with typed measurements only, note in the API
  payload so Gemini knows the input is text-only

**The Gemini match (backend, but you own it too)**
- [ ] `prompts/archetype-match.md`: prompt template with compliance preamble
  (banned phrases, conditional phrasing, Paralympic parity in reasoning)
- [ ] `lib/gemini.ts`: typed Vertex AI client. `matchArchetype(input)` function
  with Zod input and output schemas. Uses `response_schema` for structured
  output. Handles timeout (15s), invalid JSON (retry once), fallback
  archetype (nearest-neighbor by height/weight from the static table)
- [ ] `POST /api/match` route handler: parse input, call `matchArchetype`,
  return `ArchetypeMatch`
- [ ] Unit tests for the three failure paths (timeout, invalid JSON, fallback)

**Reveal screen**
- [ ] Reveal component. Shows archetype name, Olympic sport, Paralympic sport.
  Paralympic sport is visually first or given equivalent visual weight.
  Includes a "continue" button that hands off to Aditya's moment flow.
- [ ] Loading state during Gemini call (~3s). Must feel intentional, not
  broken. Subtle animation, one line of copy like "analyzing your
  archetype..."

**Compliance touchpoints**
- [ ] Prompt preamble on every Gemini call (no athlete names, conditional
  phrasing, Paralympic parity)
- [ ] Runtime Gemini output scanner (`lib/compliance.ts`) checks text output
  for banned phrases, retries once if triggered

**Definition of done:** a stranger can land on the site, take the quiz, enter
measurements, grant or deny webcam, and reach a populated reveal screen with a
real Gemini-matched archetype. Works on Chrome desktop. Loading states never
look broken.

## Aditya — Moment Engine + Everything After

**Feature:** from the reveal screen onward. Two animated sport moments (pose
or spacebar triggered, slo-mo on release, pre-computed commentary), the
personalized narrative screen, and the share card.

### Tasks

**The moment player**
- [ ] Moment page scaffolding. Video container + webcam overlay (if granted)
  + spacebar listener + commentary overlay layer
- [ ] HTML5 video element with programmatic `currentTime` control. Knows the
  "release-cue frame" timestamp per video. Plays to cue, pauses, enters
  slo-mo mode, resumes at 0.5x speed through the outro
- [ ] Pose trigger hook (`hooks/usePoseTrigger.ts`). Reads MediaPipe landmarks,
  tracks a single joint's velocity (wrist for throws, shoulder for shots,
  knee for jumps). Fires once per session when threshold crossed. Debounced
  so rapid motion doesn't re-trigger
- [ ] Spacebar fallback. Works identically to the pose trigger. Universal
  path for webcam-denied users and mobile
- [ ] Pre-computed commentary strings per archetype × sport × variant
  (stored in archetype-lookup.json, Gemini-authored at build time). 3
  variants per pairing, randomly picked

**Motion design (the big art asset load)**
- [ ] Figma file: color palette, type system, silhouette character style,
  motion language. Locked first so everything else builds on it.
- [ ] One silhouette character rig in 3-4 canonical poses (ready stance,
  release-arm, stride, aim-hold). Abstract, no face, NIL-safe
- [ ] 10 moment videos: 5 archetypes × 2 sports (1 Olympic + 1 Paralympic).
  Each ~15 seconds. Reuse the silhouette rig across 10 stylized backdrops
  (basketball court, pool surface, track lane, archery range, throwing
  circle, and Paralympic variants). Paralympic moments get equal production
  budget
- [ ] Videos hosted on Cloud Storage (Shuarya or shared task to set up
  bucket). Preload next moment's video while on reveal screen

**Narrative screen**
- [ ] `POST /api/narrative` route. Takes archetype + quiz answers, calls
  Gemini 2.5 Pro with `prompts/narrative.md`, returns 4-6 narrative beats
  templated with aggregate data ("your archetype has represented Team USA
  in N decades, M hometowns, across basketball and wheelchair basketball")
- [ ] Narrative screen component. Renders beats with typography animation,
  one beat at a time, cinematic pacing
- [ ] Paralympic data beat is structurally present, not optional

**Share card**
- [ ] 5 pre-rendered archetype base cards designed in Figma. Use Imagen 4
  (build-time only, via Shuarya's Vertex AI setup) for abstract backgrounds.
  No human figures in generated content per compliance
- [ ] `POST /api/share-card` route. Takes archetype + user caption, overlays
  caption on the right base card via Satori/`@vercel/og`, uploads to Cloud
  Storage, returns public URL
- [ ] Share card display component with download button + copy-link button

**Polish**
- [ ] Transitions between every screen (reveal → moment → moment → narrative
  → share). Page-to-page choreography, not hard cuts
- [ ] Sound design cues (optional, use Epidemic Sound or similar licensed).
  Slo-mo whoosh, outcome stinger, narrative typewriter tick
- [ ] Mobile responsive layouts at 375/768/1024. Tap-to-trigger on mobile.
  "Desktop recommended for the full experience" banner on mobile
- [ ] Error boundaries wired to specific error types (video 404, share
  card render fail, narrative timeout). Never shows a white screen

**Definition of done:** from reveal to share card, the flow is visually
cinematic, works with or without webcam, and the 60-second "moment" segment
of the demo video looks unmistakably premium.

## Shared — Infra, Compliance, Demo

Neither of you owns this alone. Whoever has a spare 2 hours grabs the next
shared task. Pair on the ones that need it.

- [ ] **GCP project setup (day 1, pair on this).** Enable Vertex AI, Cloud
  Run, Cloud Storage, Artifact Registry APIs. Service account with
  `roles/aiplatform.user` + `roles/storage.objectAdmin`. Prove a Vertex AI
  call from a laptop before writing any product code. 90 minutes together,
  no IAM surprises later.
- [ ] **Cloud Storage bucket** for moment videos + share cards. CORS
  configured for the Cloud Run domain
- [ ] **Cloud Run deployment.** Dockerfile, `gcloud run deploy` with
  `min-instances=1`, `max-instances=10`, us-central1, 1 CPU, 1Gi memory.
  First deploy once end-to-end flow works locally (around the midpoint of
  the build)
- [ ] **GitHub Actions workflow** to auto-deploy on push to main. Build
  container, push to Artifact Registry, deploy to Cloud Run
- [ ] **Rate limiting middleware** on `/api/match` (10 req/min/IP) to
  prevent runaway costs
- [ ] **Billing alert** at $50 via Cloud Monitoring
- [ ] **Observability:** structured logs for every Gemini call (correlation
  ID, model, latency, outcome) to Cloud Logging
- [ ] **Compliance lint** (`etl/scripts/compliance-lint.ts`). Scans .tsx,
  .ts, .md, .json for banned phrases (former Olympian, NGB names, IOC IP
  terms) and for athlete names from the gitignored list. Runs in CI on
  every PR. Runs as pre-commit hook locally. Fails the build on any match.
  Unit tests with positive and negative cases
- [ ] **Manual compliance walkthrough** before submission. Read every
  user-visible string, every prompt file, every piece of copy. Catch what
  the lint can't
- [ ] **Demo video (3 minutes).** Script, screen recording of deployed app,
  Google Cloud console footage (Vertex AI Studio with prompt, Cloud Run
  service page, GitHub Actions deploy log), licensed music, export 1080p.
  Upload unlisted to YouTube. Paralympic moment shown first in the video
- [ ] **Devpost submission.** Description hits all three rubric beats
  (Impact 40, Technical 30, Presentation 30). Public repo link with Apache
  2.0 license visible. README with setup instructions. Submit before 5pm
  PDT May 11

## Shared Types (agree early, version carefully)

`lib/types.ts` is the contract between Shuarya's onboarding and Aditya's
moment engine. Shuarya drafts first, Aditya reviews, both commit together.

```ts
export type ArchetypeId = 'striker' | 'flow' | 'spring' | 'aim' | 'launch';

export type SportPairing = {
  olympic: string;        // e.g. "basketball"
  paralympic: string;     // e.g. "wheelchair basketball"
};

export type ArchetypeMatch = {
  archetype: ArchetypeId;
  sports: SportPairing;
  narrativeBeats: string[];  // 4-6 Gemini-generated beats
  quizVector: number[];      // for analytics / narrative fuel
  confidence: number;        // 0-1, informational only
  isFallback: boolean;       // true if Gemini failed, using nearest-neighbor
};

export type UserInput = {
  heightCm: number;
  weightKg: number;
  wingspanCm?: number;
  quiz: QuizAnswers;
  silhouettePng?: string;    // base64, 512×512, optional
};
```

Changes to this type are a shared decision. Not unilateral.

## Decision rules for speed

- **Tech disagreements:** default to simpler. Re-discuss after v1 ships.
- **Scope disputes:** default to smaller. "Add to post-submission roadmap"
  is always acceptable.
- **Blocked on the other owner's work:** 30-minute rule. If blocked for
  more than 30 minutes, ping the other person, then switch to polish or
  nice-to-have tasks in your own area
- **Visual/motion/copy calls:** Aditya decides
- **Data/infra/compliance calls:** Shuarya decides
- **Ties break toward "ships on time"**

## Sync cadence

- **End of each work session:** 15-minute walkthrough. What landed, what's
  blocked, what merges tonight
- **Midpoint check-in:** full end-to-end flow must work, even if rough.
  If it does not, scope gets cut, not delayed
- **Feature freeze point:** roughly 2 days before submission. After this,
  only bug fixes and polish. No new features no matter how cool
- **Pre-submission:** both builders do a full manual walkthrough on
  desktop Chrome + Safari + mobile. Sign off together

## Risks accepted (know what they are)

- No automated E2E tests (manual daily smoke substitute)
- No systematic Gemini output evals (prompt-crafting rigor substitute)
- Motion design for 10 videos is the largest art asset load. Mitigation:
  one silhouette rig, 10 backdrops, aggressive reuse
- Gemini multimodal latency on the match call (~3s). Handled via
  intentional loading-state copy

## Definition of "submission ready"

- Hosted Cloud Run URL is stable and green
- Full flow works on Chrome desktop with webcam
- Full flow works on Chrome desktop with webcam denied (spacebar)
- Full flow works on mobile with tap-to-trigger
- Compliance lint passes in CI
- No athlete names anywhere in committed code or UI
- Apache 2.0 license visible in README
- Demo video uploaded unlisted on YouTube
- Devpost submission complete before 5pm PDT May 11
