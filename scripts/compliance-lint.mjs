#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const checkedExtensions = new Set([".ts", ".tsx", ".md", ".json"]);
const skippedDirs = new Set([".git", ".next", ".compliance", "graphify-out", "node_modules"]);
const skippedFiles = new Set(["package-lock.json"]);
const rulebookDocs = new Set([
  "docs/compliance-notes.md",
  "docs/data-sources.md",
  "docs/hackathon-faq-brief.md",
  "docs/plan/become-team-usa-design-doc.md",
  "docs/plan/work-split.md"
]);

const bannedPatterns = [
  { label: "athlete comparison claim", pattern: /\byou are most like\b/i },
  { label: "performance guarantee", pattern: /\b(will|guaranteed to)\s+be good at\b/i },
  { label: "body type guarantee", pattern: /\bbody type means\b/i },
  { label: "future olympian claim", pattern: /\bfuture olympian\b/i },
  { label: "former olympian terminology", pattern: /\bformer (olympian|paralympian)\b/i },
  { label: "past olympian terminology", pattern: /\bpast (olympian|paralympian)\b/i },
  { label: "protected rings reference", pattern: /\bolympic rings\b/i },
  { label: "protected agitos reference", pattern: /\bagitos\b/i },
  { label: "protected torch reference", pattern: /\bolympic torch\b|\btorch relay\b/i },
  { label: "official logo reference", pattern: /\bteam usa logo\b|\busopc logo\b/i },
  { label: "ngb name", pattern: /\busa (swimming|basketball|archery|track)\b/i }
];

const athleteNames = loadAthleteNames();
const findings = [];

for (const file of walk(root)) {
  const path = relative(root, file);
  if (!checkedExtensions.has(extname(path)) || skippedFiles.has(path)) {
    continue;
  }

  const text = readFileSync(file, "utf8");
  const isRulebook = rulebookDocs.has(path);

  if (!isRulebook) {
    for (const rule of bannedPatterns) {
      for (const finding of findPattern(text, rule.pattern)) {
        findings.push({ path, line: finding.line, label: rule.label, match: finding.match });
      }
    }
  }

  for (const athleteName of athleteNames) {
    const escapedName = athleteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const finding of findPattern(text, new RegExp(`\\b${escapedName}\\b`, "i"))) {
      findings.push({ path, line: finding.line, label: "athlete name", match: finding.match });
    }
  }
}

if (findings.length > 0) {
  console.error("Compliance lint failed:");
  for (const finding of findings) {
    console.error(`- ${finding.path}:${finding.line} ${finding.label}: ${finding.match}`);
  }
  process.exit(1);
}

console.log("Compliance lint passed.");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (skippedDirs.has(entry)) {
      continue;
    }

    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      yield* walk(path);
    } else if (stats.isFile()) {
      yield path;
    }
  }
}

function findPattern(text, pattern) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = line.match(pattern);
    if (match) {
      findings.push({ line: index + 1, match: match[0] });
    }
  }
  return findings;
}

function loadAthleteNames() {
  const path = join(root, ".compliance", "athlete-names.txt");
  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && !line.startsWith("#"));
}
