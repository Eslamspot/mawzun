/**
 * The audit engine entry point.
 *
 * Runs the three layers in order and then the verdict rule, and seals the whole
 * run into a record. The engine itself is pure — no network, no storage, no
 * clock beyond the timestamp it is handed — so the same input with the same
 * semantic provider yields the same findings and the same verdict. That is what
 * makes "re-run it and you get the same verdict" a property rather than a hope.
 */

import type { AuditInput, AuditResult, CoverageNote, Finding } from "./types";
import type { LayerContext } from "./layer-context";
import { runLayer1 } from "./layer1-deterministic";
import { runLayer2, type AlignmentKind } from "./layer2-lexical";
import { declaredGapProvider, type SemanticProvider } from "./layer3-semantic";
import { computeVerdict, summariseLayers } from "./verdict";
import { buildUnsignedRecord, sealRecord, type AuditRecord } from "./record";

export interface AuditRunOptions {
  /** Injected so the engine stays testable and the browser stays model-free. */
  readonly semantic?: SemanticProvider;
  /** Fixed timestamp, so a replayed run produces an identical record. */
  readonly now?: string;
}

export interface AuditRunOutput {
  readonly result: AuditResult;
  readonly record: AuditRecord;
  /** Model output that failed the verbatim-quote gate, kept for the record. */
  readonly rejected: readonly string[];
  readonly alignment: AlignmentKind;
}

const NEEDS_MODEL_REASON =
  "الطبقة الدلالية لم تُشغَّل في هذا البناء: تحتاج ربط نموذج. ما كان يمكن كشفه بالاستدلال الدلالي غير مفحوص.";

export async function runAudit(input: AuditInput, options: AuditRunOptions = {}): Promise<AuditRunOutput> {
  const findings: Finding[] = [];
  const coverage: CoverageNote[] = [];
  let checked = 0;
  let alignment: AlignmentKind = "proportional";
  let model: { id: string | null; promptHash: string | null } = { id: null, promptHash: null };
  let rejected: string[] = [];

  const ctx: LayerContext = {
    source: input.sourceText,
    derived: input.derivedText,
    language: input.targetLanguage,
    level: input.contentLevel,
    bank: input.bank,
  };

  if (input.contentLevel === "D") {
    // Level د is never checked: the rule is to stop and refer, so running the
    // layers would produce a verdict the system is not allowed to give.
    coverage.push({
      layer: "L1",
      kind: "quote",
      reason: "مستوى (د): لم يُجرَ أي فحص بحسب القاعدة؛ النظام يوقف ويحيل.",
    });
  } else {
    const l1 = runLayer1(ctx);
    findings.push(...l1.findings);
    coverage.push(...l1.coverage);
    checked += l1.checked;

    const l2 = runLayer2(ctx);
    findings.push(...l2.findings);
    coverage.push(...l2.coverage);
    checked += l2.checked;
    alignment = l2.alignment;

    const provider = options.semantic ?? declaredGapProvider(NEEDS_MODEL_REASON);
    try {
      const l3 = await provider.run(ctx);
      findings.push(...l3.findings);
      coverage.push(...l3.coverage);
      checked += l3.checked;
      model = { id: l3.model, promptHash: l3.promptHash };
      rejected = l3.rejected;
    } catch (error) {
      // A failing provider must not cost us the deterministic findings. The
      // failure is recorded as a declared gap, so the verdict states that the
      // semantic layer did not produce a result rather than passing quietly.
      const detail = error instanceof Error ? error.message : String(error);
      coverage.push({
        layer: "L3",
        kind: "condition",
        reason: `فشلت الطبقة الدلالية في هذا التشغيل: ${detail}. ما كان يمكن كشفه بالاستدلال الدلالي غير مفحوص.`,
      });
    }
  }

  findings.sort((a, b) => (a.layer === b.layer ? a.start - b.start : a.layer.localeCompare(b.layer)));

  const { summary, coverage: allCoverage } = summariseLayers(findings, coverage);
  const { verdict, reason } = computeVerdict(
    input.contentLevel,
    findings,
    allCoverage,
    checked,
    input.sourceText,
    input.derivedText,
  );

  const result: AuditResult = {
    verdict,
    reason,
    findings,
    layerSummary: summary,
    coverage: allCoverage,
  };

  const unsigned = buildUnsignedRecord(input, result, model, options.now);
  const record = await sealRecord(unsigned);

  return { result, record, rejected, alignment };
}

export { buildConstraintBank, bankLanguages, CONSTRAINT_BANK_VERSION } from "./constraint-bank";
export { declaredGapProvider, modelProvider, buildSemanticPrompt, parseSemanticFindings } from "./layer3-semantic";
export type { SemanticProvider, SemanticCallResult, SemanticCaller } from "./layer3-semantic";
export { verifyRecord, canonicalJson, sha256Hex, ENGINE_VERSION, buildUnsignedRecord, sealRecord } from "./record";
export type { AuditRecord, VerifyOutcome } from "./record";
export { RULING_TERMS, FORCE_PROFILES, forcesConflict } from "./ruling-strength";
export type { RulingForce } from "./ruling-strength";
export { segmentText } from "./layer2-lexical";
export type * from "./types";
