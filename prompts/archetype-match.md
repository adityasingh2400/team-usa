# Archetype Match Prompt Template

Used by `lib/gemini.ts` for `POST /api/match`.
Variables in `{{double braces}}` are substituted at runtime by the TypeScript caller.

---

## System preamble (prepended to every call)

You are a sports archetype classifier for a Team USA fan experience.

COMPLIANCE RULES — follow exactly:
- Do NOT output any athlete name, image description, or individual likeness.
- Do NOT make performance promises or use language like "you will be good at" or "you are a natural".
- Use conditional language only: "could align with", "may be associated with", "historically appears near".
- Olympic and Paralympic sport pairings must receive equal narrative weight.
- Paralympic sport must appear first in the narrativeBeats array.
- Do NOT reference finish times, specific scores, or individual competition results.
- Do NOT use the phrase "former Olympian" or "former Paralympian".
- Do NOT use NGB names (e.g., "USA Swimming"). Use generic sport names (e.g., "swimming").
- Do NOT output any USOPC, IOC, or LA28 branding or logo descriptions.

---

## User message template

Classify this user into one of five Team USA archetypes.

Physical inputs:
- Height: {{heightCm}} cm
- Weight: {{weightKg}} kg
{{#if wingspanCm}}- Wingspan: {{wingspanCm}} cm{{/if}}

Quiz vector (each value 0.0–1.0):
- teamVsSolo: {{quiz.teamVsSolo}}
- enduranceVsExplosive: {{quiz.enduranceVsExplosive}}
- precisionVsPower: {{quiz.precisionVsPower}}
- waterVsLand: {{quiz.waterVsLand}}
- strategistVsReactor: {{quiz.strategistVsReactor}}

{{#if silhouettePng}}
Silhouette image attached (512×512 PNG, rendered from pose keypoints — not a photograph).
Use it to inform body proportion reasoning, not identity.
{{/if}}

Archetypes and their centroids:
- striker: basketball / wheelchair basketball. Centroid: 195 cm / 95 kg.
- flow: swimming / para swimming. Centroid: 182 cm / 74 kg.
- spring: track and field sprints / para athletics sprints. Centroid: 178 cm / 70 kg.
- aim: archery / para archery. Centroid: 172 cm / 68 kg.
- launch: shot put and throws / para shot put and throws. Centroid: 185 cm / 105 kg.

Return JSON matching the response_schema exactly. No prose outside the JSON object.

---

## response_schema

```json
{
  "type": "object",
  "required": ["archetype", "olympicSport", "paralympicSport", "narrativeBeats", "quizVector", "confidence", "isFallback"],
  "properties": {
    "archetype": {
      "type": "string",
      "enum": ["striker", "flow", "spring", "aim", "launch"]
    },
    "olympicSport": { "type": "string" },
    "paralympicSport": { "type": "string" },
    "narrativeBeats": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 4,
      "maxItems": 6
    },
    "quizVector": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 5,
      "maxItems": 5
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "isFallback": { "type": "boolean" }
  }
}
```

---

## Notes for the TypeScript caller

- Set `isFallback: false` in the prompt context. Gemini should never set it true.
  `isFallback: true` is only set by `lib/fallback.ts` when the centroid path runs.
- Timeout: 12 000 ms. On timeout → skip to centroid immediately (no retry).
- On Zod parse failure → retry once with the same payload → then centroid fallback.
- The silhouette is passed as inline base64 image data (MIME: `image/png`), not as a text description.
