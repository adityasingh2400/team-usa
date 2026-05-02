#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const rawDir = join(root, "etl", "raw");
const outputPath = join(root, "public", "data", "archetype-lookup.json");
const athleteNamesPath = join(root, ".compliance", "athlete-names.txt");
const supportedExtensions = new Set([".csv", ".json", ".xlsx"]);

const lookup = JSON.parse(readFileSync(outputPath, "utf8"));
const rows = await loadRows(rawDir);
const teamUsaRows = rows.filter(isTeamUsaRow);
const athleteNames = extractAthleteNames(teamUsaRows);

mkdirSync(join(root, ".compliance"), { recursive: true });
writeFileSync(athleteNamesPath, `${athleteNames.join("\n")}${athleteNames.length ? "\n" : ""}`);

const archetypes = lookup.archetypes.map((archetype) => ({
  ...archetype,
  aggregateCounts: {
    olympicRosterRows: countSportRows(teamUsaRows, archetype.sports.olympic, "olympic"),
    paralympicRosterRows: countSportRows(teamUsaRows, archetype.sports.paralympic, "paralympic")
  }
}));

const nextLookup = {
  ...lookup,
  generatedFrom: rows.length
    ? `ETL aggregate output from ${teamUsaRows.length} Team USA roster rows. Public output contains counts only.`
    : lookup.generatedFrom,
  etl: {
    rawFilesRead: existsSync(rawDir) ? readdirSync(rawDir).filter((file) => supportedExtensions.has(extname(file))).length : 0,
    teamUsaRows: teamUsaRows.length,
    athleteNamesExtracted: athleteNames.length,
    generatedAt: new Date().toISOString()
  },
  archetypes
};

writeFileSync(outputPath, `${JSON.stringify(nextLookup, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(`Wrote ${athleteNamesPath} (${athleteNames.length} names, gitignored)`);

async function loadRows(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const allRows = [];
  for (const file of readdirSync(dir)) {
    const path = join(dir, file);
    const extension = extname(file);
    if (!supportedExtensions.has(extension)) {
      continue;
    }

    if (extension === ".csv") {
      allRows.push(...parseCsv(readFileSync(path, "utf8")));
    } else if (extension === ".json") {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      allRows.push(...(Array.isArray(parsed) ? parsed : parsed.rows ?? parsed.data ?? []));
    } else if (extension === ".xlsx") {
      allRows.push(...await parseXlsx(path));
    }
  }

  return allRows.map(normalizeRow);
}

async function parseXlsx(path) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);

  const rows = [];
  workbook.eachSheet((worksheet) => {
    const headers = [];
    worksheet.eachRow((row, rowNumber) => {
      const values = row.values.slice(1).map((value) => String(value ?? "").trim());
      if (rowNumber === 1) {
        headers.push(...values);
        return;
      }
      rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
    });
  });

  return rows;
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) {
    return [];
  }

  const headers = splitCsvLine(headerLine);
  return lines.map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
      String(value ?? "").trim()
    ])
  );
}

function isTeamUsaRow(row) {
  const teamText = [
    row.team,
    row.country,
    row.noc,
    row.delegation,
    row.nationality,
    row.affiliate
  ].filter(Boolean).join(" ").toLowerCase();

  return /\b(usa|united states|team usa|usopc)\b/i.test(teamText);
}

function extractAthleteNames(rosterRows) {
  const names = new Set();
  for (const row of rosterRows) {
    const name = row.full_name || row.athlete_name || row.athlete || row.name;
    if (name && /\s/.test(name)) {
      names.add(name.replace(/\s+/g, " ").trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function countSportRows(rosterRows, sport, lane) {
  const sportNeedles = sport
    .toLowerCase()
    .replace(/\bpara\b/g, "")
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 4);

  return rosterRows.filter((row) => {
    const rowSport = [row.sport, row.discipline, row.event, row.event_name].filter(Boolean).join(" ").toLowerCase();
    const rowLane = [row.games_type, row.team_type, row.competition, row.source, row.event].filter(Boolean).join(" ").toLowerCase();
    const sportMatches = sportNeedles.some((needle) => rowSport.includes(needle));
    const laneMatches = lane === "paralympic" ? rowLane.includes("para") : !rowLane.includes("para");
    return sportMatches && laneMatches;
  }).length;
}
