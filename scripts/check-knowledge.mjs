#!/usr/bin/env node
/**
 * Knowledge-base integrity check.
 *
 * `data/knowledge/` vendors the scientific package (Mawzoon_JSON): the
 * approved-constraints registry, the verdict schema, the golden cases, the
 * standard/domains/levels, the sources and the registry schema. This script
 * verifies shape and counts so a corrupted or half-copied import fails loudly
 * instead of silently starving the future Q&A path.
 *
 * Run with: `bun run knowledge:check`
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KNOWLEDGE_ROOT = path.join(REPO_ROOT, "data", "knowledge");

const errors = [];

function readJson(file) {
  const full = path.join(KNOWLEDGE_ROOT, file);
  if (!fs.existsSync(full)) {
    errors.push(`missing file: data/knowledge/${file}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (error) {
    errors.push(`invalid JSON in data/knowledge/${file}: ${error.message}`);
    return null;
  }
}

function requireKeys(name, obj, keys) {
  for (const key of keys) {
    if (obj == null || !(key in obj)) errors.push(`${name}: missing key "${key}"`);
  }
}

// --- 1. constraints registry --------------------------------------------
const registry = readJson("1_القيود_المعتمدة.json");
if (registry) {
  requireKeys("constraints registry", registry, ["constraints", "approval"]);
  const constraints = Array.isArray(registry.constraints) ? registry.constraints : [];
  if (constraints.length !== 31) {
    errors.push(`constraints registry: expected 31 constraints, found ${constraints.length}`);
  }
  const kinds = new Set(["term", "ruling", "isnad", "number", "condition"]);
  const origins = new Set([
    "official_dictionary",
    "official_document",
    "approved_reference",
    "gamhara_verified",
    "registry_extension",
  ]);
  for (const c of constraints) {
    for (const key of ["id", "kind", "label_ar", "rule_ar", "level", "origin"]) {
      if (!c || !(key in c) || c[key] === "" || c[key] == null) {
        errors.push(`constraint ${c?.id ?? "?"}: missing "${key}"`);
      }
    }
    if (c && !kinds.has(c.kind)) errors.push(`constraint ${c.id}: unknown kind "${c.kind}"`);
    if (c && !origins.has(c.origin)) errors.push(`constraint ${c.id}: unknown origin "${c.origin}"`);
  }
  if (registry.approval?.status !== "candidate_for_approval") {
    errors.push(`constraints registry: unexpected approval status "${registry.approval?.status}"`);
  }
}

// --- 2. verdict schema ----------------------------------------------------
const verdictSchema = readJson("2_صيغة_المخرج_الإلزامية.json");
if (verdictSchema) {
  requireKeys("verdict schema", verdictSchema, ["$schema", "properties", "required"]);
}

// --- 3. golden cases -------------------------------------------------------
const golden = readJson("3_حالات_الاختبار_15.json");
if (golden) {
  const cases = Array.isArray(golden.cases) ? golden.cases : [];
  if (cases.length !== 15) errors.push(`golden cases: expected 15, found ${cases.length}`);
  for (const c of cases) {
    for (const key of ["id", "source_text", "derived_text", "expected_verdict"]) {
      if (!c || !(key in c)) errors.push(`golden case ${c?.id ?? "?"}: missing "${key}"`);
    }
  }
}

// --- 4. standard / domains / levels ----------------------------------------
const standard = readJson("4_المعيار_والمجالات_والمستويات.json");
if (standard) {
  requireKeys("standard", standard, ["domains", "levels"]);
  const levels = Array.isArray(standard.levels) ? standard.levels.map((l) => l.id) : [];
  for (const id of ["a", "b", "c", "d"]) {
    if (!levels.includes(id)) errors.push(`standard: missing level "${id}"`);
  }
}

// --- 5. sources -------------------------------------------------------------
const sources = readJson("5_المصادر.json");
if (sources) {
  const list = Array.isArray(sources.sources) ? sources.sources : [];
  if (list.length !== 13) errors.push(`sources: expected 13, found ${list.length}`);
  for (const s of list) {
    for (const key of ["id", "name_ar", "url"]) {
      if (!s || !s[key]) errors.push(`source ${s?.id ?? "?"}: missing "${key}"`);
    }
  }
}

// --- 6. registry schema -------------------------------------------------------
const registrySchema = readJson("6_مخطط_التحقق_من_القيود.json");
if (registrySchema) {
  requireKeys("registry schema", registrySchema, ["$schema", "properties"]);
}

if (errors.length > 0) {
  console.error(`\n✖ knowledge:check failed with ${errors.length} problem(s):\n`);
  for (const error of errors.slice(0, 25)) console.error(`  - ${error}`);
  if (errors.length > 25) console.error(`  … and ${errors.length - 25} more`);
  console.error("");
  process.exit(1);
}

console.log("✓ knowledge:check passed — 31 constraints · 15 golden cases · 13 sources · 4 levels.");
