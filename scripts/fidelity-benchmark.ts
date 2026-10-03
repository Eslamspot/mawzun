/**
 * Fidelity benchmark — runs the labelled corpus through the real audit engine.
 *
 * Run with:  bun scripts/fidelity-benchmark.ts
 *
 * What this measures
 * ------------------
 * The corpus in `data/benchmark/corpus.json` is a set of labelled source/derived
 * pairs. Each pair declares the verdict the engine *should* reach. This runner
 * executes every pair through `runAudit` and compares the actual verdict with
 * the expected one, then writes the whole run to `data/benchmark/results.json`
 * so a reviewer can re-derive every number in the report.
 *
 * Determinism
 * -----------
 * The semantic provider is injected as `declaredGapProvider`, which produces no
 * findings and records a declared gap. The run is therefore fully deterministic,
 * free and reproducible: layers 1 and 2 only. Layer 3 is NOT measured — a drift
 * that only a model could see is invisible here, and the report says so.
 *
 * Exit code
 * ---------
 * Non-zero ONLY on a harness error (missing/invalid corpus, an unknown level or
 * work type, or a provider throwing). A missed expectation is a *result*, not a
 * failure: the benchmark exits zero and prints the miss, because a benchmark
 * that always passes proves nothing.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAudit, buildConstraintBank, declaredGapProvider } from "../src/lib/audit/index";
import type { AuditInput, ContentLevel, Finding, WorkType } from "../src/lib/audit/types";

/**
 * `import.meta.dir` is a Bun-only convenience and is not in the TypeScript types,
 * so the production build's type check rejects it. Deriving the directory from
 * `import.meta.url` is portable and type-checks under both runtimes.
 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS_PATH = path.join(REPO_ROOT, "data", "benchmark", "corpus.json");
const RESULTS_PATH = path.join(REPO_ROOT, "data", "benchmark", "results.json");

/** Frozen timestamp: the same corpus always produces the same sealed records. */
const FIXED_NOW = "2026-10-03T00:00:00.000Z";
const GAP_REASON =
  "مدوّنة القياس تشغّل الطبقتين الأولى والثانية فقط عبر declaredGapProvider: الطبقة الدلالية النموذجية غير داخلة في هذا القياس.";

/** The engine speaks latin levels; the challenge package speaks أ–د. */
const LEVEL_MAP: Readonly<Record<string, ContentLevel>> = { "أ": "A", "ب": "B", "ج": "C", "د": "D" };

const WORK_TYPES: readonly WorkType[] = ["translate", "summarize", "paraphrase"];
const EXPECTED_VERDICTS = ["faithful", "needs_revision", "refer"] as const;
type ExpectedVerdict = (typeof EXPECTED_VERDICTS)[number];

/** Which finding kind a labelled drift type is expected to surface. */
const DRIFT_KINDS: Readonly<Record<string, readonly string[]>> = {
  ruling_force: ["ruling"],
  condition_dropped: ["condition"],
  isnad: ["isnad"],
  number: ["number", "reference"],
  term: ["term"],
};

const DRIFT_TYPES = ["ruling_force", "condition_dropped", "isnad", "number", "term", "none", "level_d"] as const;

interface CorpusPair {
  readonly id: string;
  readonly workType: WorkType;
  /** Arabic level as the challenge package writes it: أ · ب · ج · د. */
  readonly contentLevel: string;
  readonly source: string;
  readonly derived: string;
  readonly expectedVerdict: ExpectedVerdict;
  readonly drift: string;
  readonly driftNote?: string;
  readonly targetLanguage?: string;
}

interface Corpus {
  readonly version: string;
  readonly description?: string;
  readonly targetLanguage?: string;
  readonly pairs: readonly CorpusPair[];
}

class HarnessError extends Error {}

const bank = buildConstraintBank();

function loadCorpus(): Corpus {
  if (!fs.existsSync(CORPUS_PATH)) throw new HarnessError(`corpus not found: ${CORPUS_PATH}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf8"));
  } catch (error) {
    throw new HarnessError(`corpus is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const corpus = parsed as Partial<Corpus>;
  if (!corpus || !Array.isArray(corpus.pairs)) throw new HarnessError("corpus.pairs is missing or not an array");
  if (corpus.pairs.length === 0) throw new HarnessError("corpus.pairs is empty");

  const seen = new Set<string>();
  for (const [i, pair] of corpus.pairs.entries()) {
    const where = `pairs[${i}]`;
    for (const field of ["id", "workType", "contentLevel", "source", "derived", "expectedVerdict", "drift"] as const) {
      if (typeof pair[field] !== "string" || (pair[field] as string).trim().length === 0) {
        throw new HarnessError(`${where}: missing required string field "${field}"`);
      }
    }
    if (seen.has(pair.id)) throw new HarnessError(`${where}: duplicate id "${pair.id}"`);
    seen.add(pair.id);
    if (!WORK_TYPES.includes(pair.workType)) throw new HarnessError(`${where} (${pair.id}): unknown workType "${pair.workType}"`);
    if (!(pair.contentLevel in LEVEL_MAP)) throw new HarnessError(`${where} (${pair.id}): unknown contentLevel "${pair.contentLevel}"`);
    if (!EXPECTED_VERDICTS.includes(pair.expectedVerdict)) {
      throw new HarnessError(`${where} (${pair.id}): unknown expectedVerdict "${pair.expectedVerdict}"`);
    }
    if (!DRIFT_TYPES.includes(pair.drift as (typeof DRIFT_TYPES)[number])) {
      throw new HarnessError(`${where} (${pair.id}): unknown drift type "${pair.drift}"`);
    }
  }
  return corpus as Corpus;
}

function serialiseFinding(f: Finding) {
  return {
    layer: f.layer,
    kind: f.kind,
    cls: f.cls,
    constraintId: f.constraintId,
    start: f.start,
    end: f.end,
    span: f.span,
    evidence: { source: f.evidence.source, derived: f.evidence.derived, note: f.evidence.note },
  };
}

function emptyMatrix(): Record<ExpectedVerdict, Record<ExpectedVerdict, number>> {
  return {
    faithful: { faithful: 0, needs_revision: 0, refer: 0 },
    needs_revision: { faithful: 0, needs_revision: 0, refer: 0 },
    refer: { faithful: 0, needs_revision: 0, refer: 0 },
  };
}

async function main(): Promise<void> {
  const corpus = loadCorpus();
  const targetLanguage = corpus.targetLanguage ?? "en";

  const pairs: Record<string, unknown>[] = [];
  const confusion = emptyMatrix();

  const perDrift = new Map<string, { total: number; detected: number; verdictMatched: number; detectedIds: string[]; missedIds: string[] }>();
  const perLevel = new Map<string, { total: number; matched: number }>();
  const perWorkType = new Map<string, { total: number; matched: number; faithful: number; needs_revision: number; refer: number }>();
  const falsePositives: { id: string; drift: string; expected: string; actual: string; reason: string }[] = [];
  const falseNegatives: { id: string; drift: string; expected: string; actual: string; reason: string }[] = [];

  let matched = 0;

  console.log(`\n=== fidelity benchmark: ${corpus.pairs.length} pairs through the real engine ===`);
  console.log(`provider: declared-gap (layers 1-2 only) | target: ${targetLanguage} | now: ${FIXED_NOW}\n`);

  for (const pair of corpus.pairs) {
    const level = LEVEL_MAP[pair.contentLevel];
    const input: AuditInput = {
      sourceText: pair.source,
      derivedText: pair.derived,
      workType: pair.workType,
      contentLevel: level,
      targetLanguage: pair.targetLanguage ?? targetLanguage,
      bank,
      reviewerDecision: null,
    };

    let output;
    try {
      output = await runAudit(input, { semantic: declaredGapProvider(GAP_REASON), now: FIXED_NOW });
    } catch (error) {
      throw new HarnessError(`pair ${pair.id}: runAudit threw: ${error instanceof Error ? error.message : String(error)}`);
    }
    const { result } = output;

    const passed = result.verdict === pair.expectedVerdict;
    if (passed) matched++;

    confusion[pair.expectedVerdict][result.verdict as ExpectedVerdict] += 1;

    // Detection is stricter than the verdict: the finding must be of the kind
    // the labelled drift type maps to, and it must be a real drift (not preserved).
    const expectedKinds = DRIFT_KINDS[pair.drift];
    let driftDetected: boolean;
    if (pair.drift === "none") {
      driftDetected = result.verdict === "faithful";
    } else if (pair.drift === "level_d") {
      driftDetected = result.verdict === "refer";
    } else {
      driftDetected = result.findings.some((f) => f.cls !== "preserved" && (expectedKinds ?? []).includes(f.kind));
    }

    const d = perDrift.get(pair.drift) ?? { total: 0, detected: 0, verdictMatched: 0, detectedIds: [], missedIds: [] };
    d.total++;
    if (driftDetected) {
      d.detected++;
      d.detectedIds.push(pair.id);
    } else {
      d.missedIds.push(pair.id);
    }
    if (passed) d.verdictMatched++;
    perDrift.set(pair.drift, d);

    const l = perLevel.get(pair.contentLevel) ?? { total: 0, matched: 0 };
    l.total++;
    if (passed) l.matched++;
    perLevel.set(pair.contentLevel, l);

    const w = perWorkType.get(pair.workType) ?? { total: 0, matched: 0, faithful: 0, needs_revision: 0, refer: 0 };
    w.total++;
    if (passed) w.matched++;
    if (result.verdict === "faithful") w.faithful++;
    if (result.verdict === "needs_revision") w.needs_revision++;
    if (result.verdict === "refer") w.refer++;
    perWorkType.set(pair.workType, w);

    if (pair.drift === "none" && result.verdict !== "faithful") {
      falsePositives.push({ id: pair.id, drift: pair.drift, expected: pair.expectedVerdict, actual: result.verdict, reason: result.reason });
    }
    if (pair.drift !== "none" && pair.drift !== "level_d" && result.verdict === "faithful") {
      falseNegatives.push({ id: pair.id, drift: pair.drift, expected: pair.expectedVerdict, actual: result.verdict, reason: result.reason });
    }

    console.log(`  ${passed ? "ok  " : "MISS"} ${pair.id} [${pair.drift}] expected=${pair.expectedVerdict} actual=${result.verdict}`);

    pairs.push({
      id: pair.id,
      workType: pair.workType,
      contentLevel: pair.contentLevel,
      engineLevel: level,
      targetLanguage: pair.targetLanguage ?? targetLanguage,
      drift: pair.drift,
      driftNote: pair.driftNote ?? null,
      expectedVerdict: pair.expectedVerdict,
      actualVerdict: result.verdict,
      passed,
      driftDetected,
      reason: result.reason,
      findings: result.findings.map(serialiseFinding),
      layerSummary: result.layerSummary,
      coverage: result.coverage,
      alignment: output.alignment,
    });
  }

  const expectedCounts = { faithful: 0, needs_revision: 0, refer: 0 };
  for (const pair of corpus.pairs) expectedCounts[pair.expectedVerdict]++;

  const totalDrift = pairs.length;
  const driftPairs = [...perDrift.entries()].filter(([t]) => t !== "none" && t !== "level_d");
  const driftDetectedTotal = driftPairs.reduce((acc, [, v]) => acc + v.detected, 0);
  const driftTotal = driftPairs.reduce((acc, [, v]) => acc + v.total, 0);

  const results = {
    run: {
      benchmarkVersion: corpus.version,
      engine: "mawzun-audit",
      engineVersion: bank.version,
      corpusSize: corpus.pairs.length,
      targetLanguage,
      now: FIXED_NOW,
      semanticProvider: "declared-gap",
      measured: "layers L1 (deterministic) and L2 (lexical)",
      notMeasured: "layer L3 (semantic) — model-dependent, deliberately excluded",
      gapReason: GAP_REASON,
    },
    summary: {
      totals: {
        pairs: totalDrift,
        matched,
        mismatched: totalDrift - matched,
        matchRate: totalDrift > 0 ? Number((matched / totalDrift).toFixed(4)) : 0,
        expected: expectedCounts,
      },
      confusion: confusion,
      driftDetection: {
        pairs: driftTotal,
        detected: driftDetectedTotal,
        missed: driftTotal - driftDetectedTotal,
        recall: driftTotal > 0 ? Number((driftDetectedTotal / driftTotal).toFixed(4)) : 0,
      },
      perDrift: Object.fromEntries(
        [...perDrift.entries()].map(([type, v]) => [
          type,
          {
            total: v.total,
            detected: v.detected,
            verdictMatched: v.verdictMatched,
            detectedIds: v.detectedIds,
            missedIds: v.missedIds,
          },
        ]),
      ),
      perContentLevel: Object.fromEntries([...perLevel.entries()]),
      perWorkType: Object.fromEntries([...perWorkType.entries()]),
      falsePositives,
      falseNegatives,
    },
    pairs,
  };

  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  console.log(`\n--- results ---`);
  console.log(`expectations met: ${matched}/${totalDrift}`);
  console.log(`confusion (expected → actual):`);
  for (const expected of EXPECTED_VERDICTS) {
    const row = confusion[expected];
    console.log(
      `  ${expected.padEnd(14)} faithful=${row.faithful} needs_revision=${row.needs_revision} refer=${row.refer}`,
    );
  }
  console.log(`drift detection (L1+L2 kinds): ${driftDetectedTotal}/${driftTotal}`);
  for (const [type, v] of perDrift) {
    console.log(`  ${type.padEnd(18)} ${v.detected}/${v.total} detected${v.missedIds.length ? ` — missed: ${v.missedIds.join(", ")}` : ""}`);
  }
  console.log(`false positives (clean pair flagged): ${falsePositives.length}${falsePositives.length ? ` — ${falsePositives.map((f) => f.id).join(", ")}` : ""}`);
  console.log(`false negatives (drifted pair passed): ${falseNegatives.length}${falseNegatives.length ? ` — ${falseNegatives.map((f) => f.id).join(", ")}` : ""}`);
  console.log(`\nresults written to ${path.relative(REPO_ROOT, RESULTS_PATH)}`);
  console.log(`\nfidelity benchmark: ${matched}/${totalDrift} expectations met, 0 harness errors`);
}

main().catch((error) => {
  if (error instanceof HarnessError) {
    console.error(`\nfidelity benchmark harness error: ${error.message}`);
  } else {
    console.error("\nfidelity benchmark crashed:", error);
  }
  process.exit(1);
});
