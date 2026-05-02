#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

loadDotEnvLocal();

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
const model = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";

if (!project) {
  console.error("Set GOOGLE_CLOUD_PROJECT before running the Gemini smoke test.");
  process.exit(1);
}

const { VertexAI } = await import("@google-cloud/vertexai");
const vertexAI = new VertexAI({ project, location });
const generativeModel = vertexAI.getGenerativeModel({
  model,
  generationConfig: {
    temperature: 0,
    responseMimeType: "application/json"
  }
});

const startedAt = Date.now();
const result = await generativeModel.generateContent({
  contents: [{
    role: "user",
    parts: [{
      text: "Return only JSON: {\"ok\":true,\"service\":\"vertex-gemini\"}"
    }]
  }]
});

const text = result.response.candidates?.[0]?.content.parts?.map((part) => "text" in part ? part.text : "").join("") ?? "";
const parsed = JSON.parse(text);
if (parsed.ok !== true) {
  throw new Error(`Unexpected Gemini smoke response: ${text}`);
}

console.log(JSON.stringify({
  event: "gemini_smoke",
  ok: true,
  project,
  location,
  model,
  latencyMs: Date.now() - startedAt
}));

function loadDotEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^"|"$/g, "");
    }
  }
}
