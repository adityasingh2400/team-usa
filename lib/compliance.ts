/**
 * Runtime compliance scanner for Gemini output.
 * Owned by Shaurya. Aditya consumes ArchetypeMatch but does not modify this file.
 *
 * Scans narrativeBeats for banned phrases. Called by /api/match before returning.
 * If a hit is found, the route retries once, then accepts the fallback result.
 */

const BANNED_PHRASES = [
  // Athlete identity
  /\b(former|current|past|retired)\s+(olympian|paralympian)\b/gi,
  // Performance promises
  /\byou (are|will be|would be|could be) (good|great|excellent|amazing|perfect|ideal) at\b/gi,
  /\byou (are|will be) a (natural|champion)\b/gi,
  // Absolute language (must stay conditional)
  /\byou are most like\b/gi,
  /\byou match\b/gi,
  // NGB names
  /\busa (swimming|track|gymnastics|archery|basketball)\b/gi,
  // Prohibited org branding in text
  /\b(usopc|ioc|la28)\b/gi,
];

export type ComplianceResult =
  | { pass: true }
  | { pass: false; hits: string[] };

export function scanOutput(beats: string[]): ComplianceResult {
  const hits: string[] = [];

  for (const beat of beats) {
    for (const pattern of BANNED_PHRASES) {
      const match = beat.match(pattern);
      if (match) {
        hits.push(`"${match[0]}" in: ${beat.slice(0, 80)}`);
      }
    }
  }

  return hits.length === 0 ? { pass: true } : { pass: false, hits };
}
