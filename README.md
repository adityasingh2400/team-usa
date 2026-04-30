# Team USA Data Strategy

This repository is a planning and data-governance workspace for the Team USA x
Google Cloud hackathon.

The first rule of the repo: raw athlete-level data should only be processed by
the final Google Cloud/Gemini pipeline. We can keep source links, schemas,
ingestion scripts, and aggregate outputs here, but avoid using non-Google
generative AI tools to inspect or transform Team USA athlete data.

## Current Contents

- `docs/data-sources.md`: curated source inventory with safety notes.
- `docs/compliance-notes.md`: NIL, IP, terminology, and output constraints.
- `docs/hackathon-faq-brief.md`: operational FAQ checklist for build decisions.
- `data/source-manifest.yml`: machine-readable list of candidate sources.

## Strategic Direction

For a user-trait matcher, the safe version is an aggregate archetype tool:

- Match users to sport/event/classification archetypes, not named athletes.
- Do not display athlete names, photos, video, or likenesses.
- Do not make performance promises.
- Use conditional language such as "could align with", "historically appears
  near", or "may be associated with".
- Keep Olympic and Paralympic representation equally prominent.
