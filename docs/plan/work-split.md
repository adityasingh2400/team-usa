# Work Split — Aditya + Shuarya

10 days, 2 builders, roughly 50/50 with Aditya taking slightly more if needed.
Lanes are designed to run in parallel with clean merge points. Each lane owns
its directories so merge conflicts are rare.

## Ownership Summary

- **Aditya (Lane A):** frontend, motion design, demo video, polish. Owns
  `app/`, `components/`, `hooks/`, `public/videos/`, Figma, final cut.
- **Shuarya (Lane B):** data, backend, Gemini, infra, compliance. Owns `etl/`,
  `lib/`, `app/api/`, `.github/workflows/`, GCP project, deploy.

Shared ownership (small surfaces, sync before merging):
- `lib/types.ts` and `lib/archetypes.ts` (data types + archetype mapping)
- `app/page.tsx` (top-level flow orchestration)

Daily sync: 15-minute end-of-day standup. Review blockers, align on next-day
priorities, agree on which merges go in overnight.

## Lane A — Aditya (Frontend + Motion + Video)

### Day 1
- Next.js 15 App Router scaffold with Tailwind, TypeScript strict, ESLint.
- Figma file: color palette, type system, silhouette character style, motion
  language. Lock the art direction.
- Landing page + input form wired to a stub `/api/match` that returns mock data.
- Install MediaPipe Tasks, basic webcam permission flow, one working pose snapshot.

### Day 2
- Reveal screen component. Renders mock archetype + Olympic + Paralympic sport.
- Base layout for moment page: video player container, webcam overlay, spacebar
  handler, slo-mo pause on gesture trigger.
- Silhouette character rig in Figma or Rive-exported-as-SVG. One body, four
  canonical poses (ready stance, release-arm, stride, aim).

### Day 3
- One complete moment flow working end-to-end with a placeholder video.
  Gesture-detected (or spacebar) → video pauses → slo-mo outro → commentary
  overlay → advance button.
- Pose trigger hook (`hooks/usePoseTrigger.ts`): reads MediaPipe landmarks,
  detects single-joint velocity change on relevant joint, fires trigger once
  per session.
- First moment video produced (Paralympic for one archetype). 15-second MP4,
  stylized backdrop, silhouette animated release.

### Day 4
- Full flow wired: landing → reveal → Paralympic moment → Olympic moment →
  narrative → share. All components render mock data.
- Second moment video produced.
- Share card component (React). Five archetype base layouts ready in Figma.

### Day 5
- Three more moment videos produced (running total: 5/10).
- Share card component consumes real archetype + user caption.
- Spacebar-fallback end-to-end tested manually.

### Day 6
- Five more moment videos produced (running total: 10/10).
- Polish pass 1: transitions, typography, timing, sound design cues, page
  transitions.

### Day 7
- Mobile responsive layouts (375px, 768px, 1024px). Tap-to-trigger on mobile.
- Desktop-recommended banner on mobile.
- Keyboard nav audit: full flow completable via keyboard only.
- Screen reader: aria-labels on archetype reveal, narrative.

### Day 8
- Polish pass 2. Copy tightening on every screen. Visual polish on share card.
  Loading state animations (the 3s Gemini match wait needs to look intentional).
- Manual full walkthrough x3, different browsers (Chrome, Safari, Firefox).

### Day 9
- Demo video production. Script the 3-minute narrative. Record screen captures
  of the deployed app. Overlay music (licensed: Epidemic Sound or Artlist).
  Cut in DaVinci/Premiere/CapCut. Export 1080p H.264.
- Upload to YouTube as unlisted.

### Day 10
- Submission day. Devpost description (hits rubric beats). README polish.
  Final visual QA.

**Lane A definition of done:** 10 moment videos, polished flow on Chrome
desktop + mobile responsive, demo video uploaded.

## Lane B — Shuarya (Data + Backend + Gemini + Infra)

### Day 1
- GCP project created. Enable Vertex AI API, Cloud Run API, Cloud Storage API,
  Artifact Registry API, IAM API.
- Service account with `roles/aiplatform.user` + `roles/storage.objectAdmin`.
- Local `gcloud auth application-default login`, write a 20-line Node script
  that calls Gemini 2.5 Pro and returns a response. Commit script to
  `etl/scripts/smoke-gemini.ts`. Document the auth flow in README.
- Pull the 2024 Olympic + Paralympic roster XLSXs into `etl/raw/` (gitignored).

### Day 2
- ETL script (`etl/scripts/build_archetype_lookup.ts` or .py): parse rosters,
  filter to Team USA, aggregate sport × state counts, output
  `public/data/archetype-lookup.json` (aggregate only, <50KB).
- Athlete-name extractor: parse roster full-name column, write
  `.compliance/athlete-names.txt` (gitignored).
- Compliance-lint script (`etl/scripts/compliance-lint.ts`). Positive + negative
  unit tests. Wire into pre-commit hook + placeholder for GitHub Actions.
- Hand-curate archetype × sport mapping JSON (5 archetypes, 10 sports). Gemini
  writes justifications as a build-time script (`etl/scripts/gen-archetype-
  justifications.ts`), output committed to archetype-lookup.json.

### Day 3
- `lib/gemini.ts`: typed client, `matchArchetype(input)`, `generateNarrative()`.
  Zod schemas for inputs and outputs. `zod-to-json-schema` for Vertex response
  schema. Unit tests for timeout + invalid JSON + fallback paths.
- `POST /api/match` route handler: validate input with Zod, call
  `matchArchetype`, return structured response. Handles silhouette image +
  measurements.
- `lib/prompts.ts`: load `.md` prompt files from `/prompts/`, template with
  user data. Write `prompts/archetype-match.md` with compliance preamble.

### Day 4
- `POST /api/narrative` route. Takes archetype + user context, returns
  personalized narrative beats. Unit tests.
- `lib/compliance.ts`: runtime scanner for banned phrases in Gemini text
  output. Retry logic. Unit tests.
- Integrate `matchArchetype` into `app/page.tsx` flow (replace mock).

### Day 5
- Dockerfile for Cloud Run. Multi-stage build. Test locally with `docker run`.
- `gcloud run deploy` to us-central1, `min-instances=1`, `max-instances=10`,
  1 CPU, 1Gi memory.
- Hosted URL tested end-to-end. Verify Vertex AI calls work from Cloud Run
  (this is where IAM surprises appear if day-1 smoke was skipped).
- GitHub Actions workflow: trigger on push to main, build container, push to
  Artifact Registry, deploy to Cloud Run. Merge-to-deploy loop active.

### Day 6
- `POST /api/share-card` route. Overlay user caption on one of five pre-rendered
  base PNGs. Use Satori/`@vercel/og` for lightweight overlay rendering. Upload
  result to Cloud Storage bucket, return public URL.
- Imagen pipeline for archetype background art (build-time script, abstract
  backgrounds only per compliance decision).
- Rate limiting middleware on `/api/match` (10 req/min/IP).

### Day 7
- CI pipeline hardening: compliance lint runs on every PR. Vitest unit tests
  run. Build fails on any failure.
- Billing alert configured at $50 via Cloud Monitoring.
- Observability: structured logs for every Gemini call (correlation ID, model,
  latency, success/fail) to Cloud Logging.

### Day 8
- Error boundary components wired to specific error types (webcam denied,
  Gemini timeout, video 404, share card render fail).
- Second pass on all prompts. Tighten for compliance and output quality.
- Verify all 10 moment videos uploaded to Cloud Storage with correct CORS.

### Day 9
- Demo-day operational prep: confirm deployment green, quota headroom on
  Vertex AI, Cloud Run warm instance active.
- Help Aditya produce Google Cloud console screen recordings: Vertex AI Studio
  with prompt, Cloud Run service page, GitHub Actions deploy log.

### Day 10
- Final repo audit: Apache 2.0 license visible at top of README, clear setup
  instructions, Google Cloud usage visible in code paths (Vertex AI imports,
  Cloud Run deploy manifest), no gitignored files committed, no athlete names
  or banned phrases anywhere.

**Lane B definition of done:** hosted URL stable with min-instances=1,
compliance CI green, rate-limited Gemini pipeline, all data aggregated
and compliant.

## Shared Work / Sync Points

| Day | Sync point |
|-----|------------|
| 1 end | Art direction + GCP auth both confirmed working |
| 2 end | Archetype dataset + UI scaffolding integrated with mock data |
| 4 end | End-to-end flow working with real Gemini (even if rough) |
| 5 end | Deployed to Cloud Run, both builders testing hosted URL |
| 7 end | Feature freeze. Only polish and bug fixes after this point. |
| 8 end | Manual full-flow walkthroughs x5 across both builders, no critical bugs |
| 9 end | Demo video locked, submission materials drafted |
| 10 | Submission before 5pm PDT May 11 |

## Decision Rules for Fast Resolution

- **Tech disagreements:** default to the simpler option. Re-discuss after v1
  ships if relevant.
- **Scope disputes:** default to the smaller scope. "Add to post-submission
  roadmap" is always acceptable.
- **Blocked on other lane:** 30-minute rule. If you are blocked for >30
  minutes waiting for the other lane, ping, then switch to polish / nice-to-have
  work in your own lane.
- **Aditya has final call on visual/motion/copy.** Shuarya has final call on
  data/infra/compliance. Ties break toward "ships on time."

## Risk-Accepted Deferrals

- No Playwright E2E tests (manual smoke substitute). If day 6 ends with 10
  minutes of unexpected bugs, revisit.
- No systematic Gemini output evals (prompt-crafting substitute). If on day 7
  prompt changes feel unstable, revisit.

These are captured so we know why we didn't do them.
