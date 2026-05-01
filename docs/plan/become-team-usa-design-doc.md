# Become Team USA — Design Doc

Working name. Challenge 4 (Athlete Archetype Agent) entry for the Team USA x
Google Cloud Hackathon. Submission deadline: May 11, 2026, 5pm PDT.

## Problem

Fans watching Team USA rarely see themselves in the story. Data dashboards
report on athletes from the outside. Quizzes reduce fans to buzz-feed labels.
Neither creates the moment where a fan feels present in Team USA history.

## Product

A web experience where a fan enters physical traits, gets matched by Gemini to
one of five movement archetypes, then is "transported" into two short animated
sport moments (one Olympic, one Paralympic) from that archetype's history. A
single webcam gesture triggers a slo-mo release at the climax of each moment.
Pre-computed commentary overlays during the slo-mo. The flow ends with a
personalized Gemini-written narrative about the fan's archetype across Team USA
history, and a shareable card.

Paralympic representation is structural: every archetype maps to exactly one
Olympic sport and one Paralympic sport with equal production value. The
Paralympic moment plays first in the flow.

## Challenge Selected

Challenge 4 — Athlete Archetype Agent.

## Core Flow (End-to-End)

1. Landing + input form: height, weight, optional wingspan.
2. Optional silhouette capture: user permits camera, MediaPipe BlazePose
  extracts keypoints client-side, a single silhouette frame (no face, no raw
   webcam) is rendered from keypoints.
3. `POST /api/match` → Gemini 2.5 Pro (multimodal + structured output). Inputs:
  typed measurements + silhouette frame + archetype dataset as long context.
   Output: archetype id, Olympic sport, Paralympic sport, narrative beats skeleton.
4. Reveal screen: archetype name, paired Olympic sport, paired Paralympic sport.
5. Paralympic moment (first): MP4 plays → webcam gesture OR spacebar triggers
  slo-mo pause → pre-computed per-archetype commentary overlays → outro plays.
6. Olympic moment: same structure, different MP4.
7. `POST /api/narrative` → Gemini 2.5 Pro fills narrative beats with personalized
  copy tied to user archetype + aggregate Team USA data.
8. `POST /api/share-card` → overlay user caption on one of five pre-rendered
  archetype base cards → serve PNG.

## Archetypes (Locked Structure, Content TBD)

Five archetypes, each with one Olympic and one Paralympic sport, hand-curated
with Gemini-written justifications. Working draft below; may adjust in
implementation as we validate against roster data.


| Archetype   | Olympic sport     | Paralympic sport       | Trigger gesture        |
| ----------- | ----------------- | ---------------------- | ---------------------- |
| The Striker | basketball        | wheelchair basketball  | shooting arm extension |
| The Flow    | swimming          | para swimming          | arm stroke rotation    |
| The Spring  | track sprint      | para athletics sprint  | crouch-to-explode      |
| The Aim     | archery           | para archery           | hold-steady, release   |
| The Launch  | shot put / throws | para shot put / throws | throwing motion        |


10 moment videos total. Pre-rendered as MP4, delivered via Cloud Storage + CDN,
played with HTML5 video element + `currentTime` pause at gesture-cue frame.

## Tech Stack

- Next.js 15 App Router, TypeScript, Tailwind.
- Cloud Run (us-central1, `min-instances=1` during judging period).
- Vertex AI: Gemini 2.5 Pro for match and narrative. Imagen 4 (build-time) for
abstract archetype card backgrounds only. No live mid-flow Gemini calls.
- MediaPipe Tasks BlazePose (browser WASM, lazy-loaded on moment page).
- Cloud Storage + Cloud CDN for moment videos and generated share cards.
- GitHub Actions deploy to Cloud Run (wired up day 5).
- Apache License 2.0 public repo.

## Deliberate Scope Cuts (NOT in v1)

- Hometown map / geography visualization. Dilutes Challenge 4 thesis. Replace
with a one-line data fact in the narrative.
- Firestore. No feature requires persisted state. Client state + share card URL
suffices.
- Standing-pose webcam proportion analysis as a UX flow. Redundant with typed
inputs. Replaced with single-shot silhouette for multimodal input.
- Rive state machines. Videos with `currentTime` pause are simpler.
- Live mid-moment Gemini commentary. Latency-risky. Pre-computed per
archetype × sport.
- Mobile webcam. iOS Safari pose tracking is a rabbit hole. Mobile uses
tap-to-trigger fallback.
- Playwright E2E suite. Team accepts manual daily smoke testing.
- Systematic Gemini output evals. Team accepts prompt-crafting rigor.
- Multi-language, user accounts, multiplayer, runtime Satori share card,
Imagen on human figures.

## Compliance Defenses

- Prompt preamble on every Gemini call: banned phrases, conditional phrasing
("could align with", "may be associated with"), no athlete names, no NGB
names when sport names suffice, Olympic + Paralympic equal depth.
- Runtime Gemini output scanner: scans for banned phrases, retries on hit,
falls back to canned copy after one retry.
- Build-time compliance lint in CI: scans `.tsx/.ts/.md/.json` for banned
phrases, NGB names, IOC/USOPC IP terms. Pre-commit hook + GitHub Actions.
- Athlete-name lint (day 2): parse 2024 Olympic/Paralympic roster XLSXs,
extract full names into `.compliance/athlete-names.txt` (gitignored),
compliance lint scans committed code for matches. This is the defense
against Gemini accidentally naming an athlete.
- Manual compliance walkthrough day 8 and day 10.

## Data Strategy (Implementation of `docs/data-sources.md`)

- Raw XLSX/CSV stay in `/etl/raw/` (gitignored). Never committed.
- ETL scripts in `/etl/scripts/` produce `/public/data/archetype-lookup.json`
(aggregate only). Archetype-lookup is <50KB, typed TypeScript import.
- Paralympic historical data is scoped to 1980-present (data reliably
available). Olympic is 1904-present. Copy explicitly says
"120 years of Olympic + 40+ years of Paralympic history, treated with
equal analytical depth."
- Only Google Cloud generative AI tools process athlete-level data. Cursor
and Claude write ETL code but do not ingest athlete rows into prompts.

## Performance

- Vertex AI cost: ~$0.02 per user session. $100 credits = 5000+ sessions.
- Rate limit /api/match at 10 req/min/IP. Billing alert at $50.
- MediaPipe (3-6MB) lazy-loaded on the moment page via `next/dynamic`.
- Moment videos served from Cloud Storage + CDN. ~30-80MB total.
- Gemini multimodal image resized to 512×512 before sending (~30KB per call).
- Cloud Run `min-instances=1` during judging period to eliminate cold starts.

## Test Plan (Abbreviated; see eng-review test plan artifact)

- Unit: Gemini client (timeout, invalid JSON, fallback), compliance-lint
(positive + negative), runtime compliance validator, pose trigger (synthetic
landmarks).
- Regression iron rule: any bug discovered during build → test before fix.
- Manual daily full-flow smoke from day 5.
- Deferred: Playwright E2E, Gemini output quality evals.

## Demo Video (3 minutes)

- 0:00-0:10: Abstract cold open. Team USA colors. "120 years. Where do you fit?"
- 0:10-0:30: User inputs measurements, silhouette capture, archetype reveal.
- 0:30-0:50: Reveal screen showing Olympic + Paralympic sport matches with
equal visual weight.
- 0:50-1:50: Money shot — 60 seconds of user playing the moment, Paralympic
FIRST, gesture triggers slo-mo, pre-computed commentary overlays.
- 1:50-2:20: Narrative screen, data story, share card.
- 2:20-2:50: Architecture beat — Vertex AI Studio with prompt open, Cloud Run
console with green service status, GitHub Actions deploy log visible.
- 2:50-3:00: End card with hosted URL.

## Judging Rubric Mapping

- **Impact (40%)** — Paralympic structural parity, participatory fan-centric
flow, emotional narrative reveal. Strong.
- **Technical Depth (30%)** — Gemini multimodal (silhouette) + long-context
(archetype dataset) + structured output + reasoning + Imagen for build-time
assets = four Gemini capability surfaces. Strong.
- **Presentation (30%)** — participatory mini-game in demo video,
personalized share card, sub-3-minute story arc. Strong.

## Schedule

- Day 1: GCP + Vertex AI auth smoke test. Next.js scaffold. Figma art
direction lock.
- Day 2: ETL pipeline. Athlete-name lint. `lib/gemini.ts`. Hand-curated
archetype mapping.
- Day 3-4: Match API end-to-end. First moment video + player + pose trigger +
spacebar fallback. One archetype working end-to-end.
- Day 5: All 5 archetypes wired. Cloud Run deploy. Narrative API.
- Day 5-6: Remaining 8 moment videos. Share card base design + Imagen
backgrounds.
- Day 7: Polish pass — typography, transitions, timing, sound, mobile
responsiveness, a11y.
- Day 8: Compliance lint in CI. Error states. Manual walkthrough.
- Day 9: Demo video production (script, screen recording, GCP console
footage, voiceover, music edit).
- Day 10: Final compliance review, Devpost submission, unlisted YouTube
upload. Submit by 5pm PDT May 11.

## Open Risks (Known, Accepted)

- No automated E2E tests. Relying on manual daily smoke.
- No systematic Gemini output evals. Relying on prompt hardening.
- Motion design for 10 videos in 2-3 days is the largest art asset load.
Mitigation: one silhouette character rig, reused across 10 stylized
backdrops.
- Gemini multimodal latency on the match call (user waits ~3s). Handled via
loading state copy.
- Cold start on day-1 Cloud Run deploy has IAM surprise risk. Mitigated by
day-1 auth smoke test on laptop before containerization.

## GSTACK REVIEW REPORT


| Review        | Trigger               | Why                             | Runs | Status       | Findings                                                                                   |
| ------------- | --------------------- | ------------------------------- | ---- | ------------ | ------------------------------------------------------------------------------------------ |
| CEO Review    | `/plan-ceo-review`    | Scope & strategy                | 0    | —            | —                                                                                          |
| Codex Review  | `/codex review`       | Independent 2nd opinion         | 0    | —            | —                                                                                          |
| Eng Review    | `/plan-eng-review`    | Architecture & tests (required) | 1    | CLEAR (PLAN) | 18 issues across 4 sections, all resolved or risk-accepted with reasoning; 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps                      | 0    | —            | —                                                                                          |
| DX Review     | `/plan-devex-review`  | Developer experience gaps       | 0    | —            | —                                                                                          |


**UNRESOLVED:** 0

**VERDICT:** ENG CLEARED — ready to implement. Design review recommended before
day 3 given motion-design-heavy build, but not blocking.