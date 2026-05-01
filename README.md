# Become Team USA

A Team USA x Google Cloud Hackathon entry.

Enter your physical stats and answer five questions about your athletic style. Google Gemini AI matches you to one of five Team USA sport archetypes — each with an equal Olympic and Paralympic pairing — and generates a personalized narrative about why you fit that archetype.

**Deadline: May 11, 2026**

---

## Archetypes

| ID | Olympic | Paralympic | Centroid |
|----|---------|------------|---------|
| `striker` | Basketball | Wheelchair basketball | 195 cm / 95 kg |
| `flow` | Swimming | Para swimming | 182 cm / 74 kg |
| `spring` | Track sprints | Para athletics sprints | 178 cm / 70 kg |
| `aim` | Archery | Para archery | 172 cm / 68 kg |
| `launch` | Shot put & throws | Para shot put & throws | 185 cm / 105 kg |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript strict)
- **Styling**: Tailwind CSS
- **AI**: Vertex AI Gemini 2.5 Pro via `@google-cloud/vertexai`
- **Validation**: Zod
- **Silhouette**: MediaPipe BlazePose (browser WASM, lazy-loaded)
- **Deployment**: Google Cloud Run (us-central1)

---

## Project Structure

```
app/
  page.tsx               # Landing
  quiz/                  # Quiz screen
  measure/               # Height / weight + optional silhouette capture
  reveal/                # Archetype reveal (hands off to Aditya's moment engine)
  api/match/route.ts     # POST /api/match — core Gemini endpoint
lib/
  types.ts               # Shared contract: UserInput, ArchetypeMatch, etc.
  gemini.ts              # Vertex AI client + timeout/retry/fallback logic
  fallback.ts            # Centroid nearest-neighbor fallback (no Gemini needed)
  compliance.ts          # Runtime scanner for banned phrases in Gemini output
prompts/
  archetype-match.md     # Prompt template with compliance preamble + response_schema
data/
  archetype-lookup.json  # ETL output: 5 archetypes with centroids and sport pairings
etl/                     # Data pipeline (raw/ is gitignored)
scripts/                 # Build-time tools (athlete name extractor for CI lint)
docs/
  data-sources.md        # Curated source inventory with safety notes
  compliance-notes.md    # NIL, IP, terminology, and output constraints
  hackathon-faq-brief.md # Operational FAQ checklist for build decisions
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp env.example .env.local
# Fill in GCP_PROJECT_ID in .env.local
```

### 3. Authenticate with Google Cloud

```bash
gcloud auth application-default login
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API

### `POST /api/match`

Match a user to a Team USA archetype.

**Request body:**

```json
{
  "heightCm": 183,
  "weightKg": 78,
  "wingspanCm": 185,
  "quiz": {
    "teamVsSolo": 0.7,
    "enduranceVsExplosive": 0.3,
    "precisionVsPower": 0.4,
    "waterVsLand": 0.8,
    "strategistVsReactor": 0.5
  },
  "silhouettePng": "<base64 PNG, optional>",
  "webcamDenied": false
}
```

**Response:**

```json
{
  "archetype": "flow",
  "sports": {
    "olympic": "swimming",
    "paralympic": "para swimming"
  },
  "narrativeBeats": [
    "Your inputs could align with para swimming pathways historically represented in Team USA.",
    "..."
  ],
  "quizVector": [0.7, 0.3, 0.4, 0.8, 0.5],
  "confidence": 0.84,
  "isFallback": false
}
```

`isFallback: true` means Gemini timed out or failed and the centroid fallback was used.

---

## Fallback Behavior

- **Gemini timeout (>12s)**: falls back to centroid immediately, no retry.
- **JSON / Zod parse failure**: retries once, then falls back to centroid.
- **Compliance scan hit**: retries once, then falls back to centroid.

Users never see an error screen.

---

## Compliance

This project follows the Team USA x Google Cloud Hackathon rules:

- No athlete names, photos, or likenesses in any output.
- All generative AI processing uses Google Cloud (Vertex AI / Gemini). Non-Google GenAI tools do not process Team USA data.
- Output uses conditional language only: "could align with", "may be associated with", "historically appears near".
- Olympic and Paralympic pairings receive equal representation in every archetype.
- Licensed under Apache 2.0.

---

## Google Cloud Usage

- **Vertex AI** (`us-central1`): Gemini 2.5 Pro powers the archetype match and generates narrative beats.
- **Cloud Run**: production deployment target.
- Proof of Google Cloud usage: see `lib/gemini.ts` (Vertex AI SDK calls) and `env.example`.

---

## License

Apache 2.0
