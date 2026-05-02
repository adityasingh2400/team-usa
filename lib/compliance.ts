const bannedPatterns = [
  /\bformer olympian\b/i,
  /\bfuture olympian\b/i,
  /\byou are most like\b/i,
  /\bbody type means\b/i,
  /\bwill be good at\b/i,
  /\bguaranteed\b/i,
  /\bteam usa logo\b/i,
  /\bolympic rings\b/i,
  /\bagitos\b/i,
  /\btorch relay\b/i,
  /\busa swimming\b/i,
  /\busa basketball\b/i,
  /\busa archery\b/i,
  /\busa track\b/i
];

export type ComplianceResult = {
  ok: boolean;
  matches: string[];
};

export function scanTextForCompliance(text: string): ComplianceResult {
  const matches = bannedPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source.replaceAll("\\b", ""));

  return {
    ok: matches.length === 0,
    matches
  };
}

export function assertCompliantText(text: string): void {
  const result = scanTextForCompliance(text);
  if (!result.ok) {
    throw new Error(`Gemini output failed compliance scan: ${result.matches.join(", ")}`);
  }
}
