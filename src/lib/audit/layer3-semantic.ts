/**
 * Layer 3 — semantic findings, produced by a model but never *judged* by it.
 *
 * The contract that makes this layer auditable:
 *
 * 1. The model returns **facts, not verdicts** — a list of findings, each with
 *    the question it answers, a classification, and two verbatim quotes.
 * 2. Every quote is checked against the actual text before the finding is
 *    accepted. A quote that does not appear in the source or the derived text
 *    byte-for-byte is rejected, and the rejection is recorded. The model cannot
 *    invent a location, so a fabricated finding cannot reach the verdict.
 * 3. The model never decides the outcome. It fills `Finding[]`, and
 *    `verdict.ts` computes the verdict from those findings with a fixed rule.
 *
 * The provider is injected, so the engine stays pure and testable: the browser
 * and the test harness use `declaredGapProvider`, the server route wires in the
 * Cloudflare Workers AI binding.
 */

import type { CoverageNote, Finding, FindingClass, ConstraintKind } from "./types";
import { findPhrase, normalizeWithMap } from "./normalize";
import type { LayerContext, LayerOutput } from "./layer-context";

/** The four questions this layer is allowed to ask. */
export type SemanticQuestion = "condition" | "attribution" | "ruling_force" | "term";

export interface SemanticRawFinding {
  readonly question: SemanticQuestion;
  readonly cls: FindingClass;
  /** Must appear verbatim in the source text, or the finding is rejected. */
  readonly source_quote: string;
  /** Must appear verbatim in the derived text, or the finding is rejected. */
  readonly derived_quote: string;
  readonly note: string;
}

export interface SemanticCallResult {
  readonly raw: string;
  /** Model identifier and prompt hash, recorded in the audit record. */
  readonly model: string;
  readonly promptHash: string;
}

export type SemanticCaller = (prompt: string, ctx: LayerContext) => Promise<SemanticCallResult>;

export interface SemanticProvider {
  readonly id: string;
  run(ctx: LayerContext): Promise<LayerOutput & { model: string | null; promptHash: string | null; rejected: string[] }>;
}

const QUESTION_TO_KIND: Readonly<Record<SemanticQuestion, ConstraintKind>> = {
  condition: "condition",
  attribution: "isnad",
  ruling_force: "ruling",
  term: "term",
};

const QUESTIONS: readonly SemanticQuestion[] = ["condition", "attribution", "ruling_force", "term"];
const CLASSES: readonly FindingClass[] = ["preserved", "shifted", "missing"];

/**
 * Turn raw model output into accepted findings plus a list of rejections.
 *
 * Exported because it is the security boundary of this layer: the tests drive
 * it directly with hostile model output.
 */
export function parseSemanticFindings(
  rawModelOutput: string,
  ctx: LayerContext,
): { findings: Finding[]; rejected: string[]; invalid: number } {
  const rejected: string[] = [];
  const findings: Finding[] = [];
  let invalid = 0;

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(rawModelOutput));
  } catch {
    return { findings: [], rejected: ["لم يكن مخرج النموذج JSON صالحًا — رُفض المخرج كله."], invalid: 1 };
  }

  const list =
    parsed && typeof parsed === "object" && Array.isArray((parsed as { findings?: unknown }).findings)
      ? ((parsed as { findings: unknown[] }).findings as unknown[])
      : null;

  if (!list) {
    return { findings: [], rejected: ["مخرج النموذج لا يحتوي حقل findings — رُفض كله."], invalid: 1 };
  }

  const script =
    ctx.language.toLowerCase().startsWith("ar") || ctx.language.toLowerCase().startsWith("ur")
      ? "arabic"
      : "latin";
  const sourceNorm = normalizeWithMap(ctx.source, "arabic");
  const derivedNorm = normalizeWithMap(ctx.derived, script);

  for (const item of list) {
    if (!item || typeof item !== "object") {
      invalid++;
      continue;
    }
    const f = item as Partial<SemanticRawFinding>;

    if (!f.question || !QUESTIONS.includes(f.question)) {
      rejected.push(`حقل question غير مسموح: ${String(f.question)}`);
      invalid++;
      continue;
    }
    if (!f.cls || !CLASSES.includes(f.cls)) {
      rejected.push(`حقل cls غير مسموح: ${String(f.cls)}`);
      invalid++;
      continue;
    }
    if (typeof f.source_quote !== "string" || typeof f.derived_quote !== "string") {
      rejected.push("اقتباس ناقص: كل واقعة يجب أن تحمل نصًا من الأصل ونصًا من المشتق.");
      invalid++;
      continue;
    }

    const sourceHit = findPhrase(sourceNorm, ctx.source, f.source_quote)[0];
    if (!sourceHit) {
      rejected.push(`اقتباس الأصل غير موجود في النص حرفيًا: «${truncate(f.source_quote)}»`);
      invalid++;
      continue;
    }

    if (f.cls === "missing") {
      // A missing item has no derived span by definition; accept it only with
      // an empty derived quote so the model cannot point at unrelated text.
      if (f.derived_quote.trim().length > 0) {
        rejected.push("واقعة «مفقود» يجب أن يكون اقتباس المشتق فيها فارغًا.");
        invalid++;
        continue;
      }
      findings.push({
        layer: "L3",
        constraintId: null,
        kind: QUESTION_TO_KIND[f.question],
        cls: "missing",
        start: 0,
        end: 0,
        span: "",
        evidence: { source: sourceHit.text, derived: "", note: f.note ?? "" },
      });
      continue;
    }

    const derivedHit = findPhrase(derivedNorm, ctx.derived, f.derived_quote)[0];
    if (!derivedHit) {
      rejected.push(`اقتباس المشتق غير موجود في النص حرفيًا: «${truncate(f.derived_quote)}»`);
      invalid++;
      continue;
    }

    findings.push({
      layer: "L3",
      constraintId: null,
      kind: QUESTION_TO_KIND[f.question],
      cls: f.cls,
      start: derivedHit.start,
      end: derivedHit.end,
      span: derivedHit.text,
      evidence: { source: sourceHit.text, derived: derivedHit.text, note: f.note ?? "" },
    });
  }

  return { findings, rejected, invalid };
}

/** Build the prompt. Kept here so its hash can travel in the record. */
export function buildSemanticPrompt(ctx: LayerContext): string {
  return [
    "أنت مساعد فحص أمانة نقل لنصوص شرعية. مهمتك تسجيل وقائع، لا إصدار حكم.",
    "",
    "أجب بـ JSON فقط بالشكل: {\"findings\":[{\"question\":\"condition|attribution|ruling_force|term\",\"cls\":\"preserved|shifted|missing\",\"source_quote\":\"...\",\"derived_quote\":\"...\",\"note\":\"...\"}]}",
    "",
    "قيود ملزمة:",
    "- source_quote يجب أن يكون نصًا موجودًا حرفيًا في النص الأصلي.",
    "- derived_quote يجب أن يكون نصًا موجودًا حرفيًا في النص المشتق، ويكون فارغًا إذا كان cls = missing.",
    "- اسأل أربعة أسئلة فقط: هل بقي الشرط؟ هل صحت النسبة؟ هل حفظت قوة الحكم؟ هل بقي المصطلح بمعناه المعتمد؟",
    "- لا تفتِ، ولا ترجّح مذهبًا، ولا تحكم على صحة رأي، ولا تذكر حلالًا أو حرامًا.",
    "- إن لم تجد ما يخالف، أرجع findings فارغة. الامتناع مقبول وهو أفضل من التخمين.",
    "",
    `اللغة الهدف: ${ctx.language}`,
    `مستوى المحتوى: ${ctx.level}`,
    "",
    "النص الأصلي:",
    ctx.source,
    "",
    "النص المشتق:",
    ctx.derived,
  ].join("\n");
}

/** Pull the first JSON object out of a model reply that may add prose. */
function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return raw;
  return raw.slice(start, end + 1);
}

function truncate(s: string): string {
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

/**
 * The provider used when no model binding is available (browser, tests, a
 * static export). It produces no findings and says so — an absent layer must
 * never look like a passed layer.
 */
export function declaredGapProvider(reason: string): SemanticProvider {
  return {
    id: "declared-gap",
    async run(): Promise<
      LayerOutput & { model: string | null; promptHash: string | null; rejected: string[] }
    > {
      const coverage: CoverageNote[] = [
        {
          layer: "L3",
          kind: "condition",
          reason,
        },
      ];
      return { findings: [], coverage, checked: 0, model: null, promptHash: null, rejected: [] };
    },
  };
}

/** Provider backed by a real model call (Cloudflare Workers AI in production). */
export function modelProvider(caller: SemanticCaller): SemanticProvider {
  return {
    id: "model",
    async run(ctx: LayerContext) {
      const prompt = buildSemanticPrompt(ctx);
      const { raw, model, promptHash } = await caller(prompt, ctx);
      const { findings, rejected, invalid } = parseSemanticFindings(raw, ctx);

      const coverage: CoverageNote[] = [];
      if (invalid > 0) {
        coverage.push({
          layer: "L3",
          kind: "condition",
          reason: `رُفض ${invalid} بندًا من مخرج النموذج لعدم مطابقته الصيغة أو لاقتباس غير موجود في النص. التفصيل في سجل الرفض.`,
        });
      }

      return {
        findings,
        coverage,
        checked: findings.length + invalid,
        model,
        promptHash,
        rejected,
      };
    },
  };
}
