/**
 * Layer 1 — deterministic checks, no model involved.
 *
 * What it covers: numerals, reference numbers, and the narrated grade /
 * attribution markers declared in the bank. These are presence-and-identity
 * checks between the source and the derived text, so a hit here is not an
 * opinion — it is a fact a reviewer can verify by eye.
 *
 * What it explicitly does NOT cover: Qur'anic wording. Checking a quoted verse
 * character by character needs the approved Uthmani corpus bound to the
 * deployment, which is not part of this build. Rather than pretend, the layer
 * reports the gap in `coverage` and the UI shows it.
 *
 * Finding locations: a `missing` finding has no substring of the derived text
 * to point at, so its span is zero-length and sits at the first non-space
 * character of the derived text — the reviewer's reading start. The evidence
 * carries the source form that went missing.
 */

import type { Constraint, CoverageNote, Finding } from "./types";
import { findPhrase, normalizeWithMap } from "./normalize";
import type { LayerContext, LayerOutput } from "./layer-context";

interface DigitRun {
  readonly value: string;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** Read a digit as a plain decimal, accepting Arabic-Indic and Latin styles. */
function readDigit(ch: string): number | null {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x0660 && code <= 0x0669) return code - 0x0660;
  if (code >= 0x06f0 && code <= 0x06f9) return code - 0x06f0;
  return null;
}

/** Every run of digits in `text`, read as a decimal value. */
export function extractDigits(text: string): DigitRun[] {
  const runs: DigitRun[] = [];
  let start = -1;
  let value = "";

  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    const digit = ch === undefined ? null : readDigit(ch);
    if (digit !== null) {
      if (start < 0) start = i;
      value += String(digit);
      continue;
    }
    if (start >= 0) {
      runs.push({ value, start, end: i, text: text.slice(start, i) });
      start = -1;
      value = "";
    }
  }
  return runs;
}

/** The first anchor a reviewer would look at when something is missing. */
function anchorFor(derived: string): number {
  const firstNonSpace = derived.search(/\S/);
  return firstNonSpace >= 0 ? firstNonSpace : 0;
}

function sourceForms(constraint: Constraint): string[] {
  return [...constraint.source].filter((f) => f.trim().length > 0).sort((a, b) => b.length - a.length);
}

export function runLayer1(ctx: LayerContext): LayerOutput {
  const findings: Finding[] = [];
  const coverage: CoverageNote[] = [];
  let checked = 0;

  const script = ctx.language.toLowerCase().startsWith("ar") || ctx.language.toLowerCase().startsWith("ur")
    ? "arabic"
    : "latin";
  const derivedNorm = normalizeWithMap(ctx.derived, script);
  const sourceNorm = normalizeWithMap(ctx.source, "arabic");
  const anchor = anchorFor(ctx.derived);

  // --- Numerals -----------------------------------------------------------
  const derivedValues = new Set(extractDigits(ctx.derived).map((d) => d.value));
  const seen = new Set<string>();

  for (const run of extractDigits(ctx.source)) {
    if (seen.has(run.value)) continue;
    seen.add(run.value);
    checked++;

    if (derivedValues.has(run.value)) {
      findings.push({
        layer: "L1",
        constraintId: "number-reference",
        kind: "number",
        cls: "preserved",
        start: 0,
        end: 0,
        span: run.value,
        evidence: {
          source: run.text,
          derived: run.value,
          note: `الرقم «${run.value}» موجود في النصين بالقيمة نفسها.`,
        },
      });
    } else {
      findings.push({
        layer: "L1",
        constraintId: "number-reference",
        kind: "number",
        cls: "missing",
        start: anchor,
        end: anchor,
        span: "",
        evidence: {
          source: run.text,
          derived: "",
          note: `الرقم «${run.value}» موجود في الأصل وغير موجود في النص المشتق. أرقام الآيات والأحاديث والنسب تُقارن حرفياً.`,
        },
      });
    }
  }

  // --- Composite references (e.g. 2:255, 24.31) ---------------------------
  const derivedComposite = new Set<string>();
  const compositeRx = /\d+\s*[:.]\s*\d+/g;
  let cm: RegExpExecArray | null;
  while ((cm = compositeRx.exec(ctx.derived)) !== null) derivedComposite.add(cm[0].replace(/\s+/g, ""));

  const sourceCompositeRx = /\d+\s*[:.]\s*\d+/g;
  while ((cm = sourceCompositeRx.exec(ctx.source)) !== null) {
    const key = cm[0].replace(/\s+/g, "");
    checked++;
    if (!derivedComposite.has(key)) {
      findings.push({
        layer: "L1",
        constraintId: "number-reference",
        kind: "reference",
        cls: "missing",
        start: anchor,
        end: anchor,
        span: "",
        evidence: {
          source: cm[0],
          derived: "",
          note: "إحالة رقمية (سورة:آية أو نسبة) موجودة في الأصل وغير موجودة في المشتق.",
        },
      });
    }
  }

  // --- Isnad: narrated grade and attribution ------------------------------
  for (const constraint of ctx.bank.constraints) {
    if (constraint.kind !== "isnad") continue;

    const forms = sourceForms(constraint);
    const approved = constraint.approved[ctx.language] ?? [];

    const sourceHit = forms.find((form) => findPhrase(sourceNorm, ctx.source, form).length > 0);
    if (!sourceHit) continue;
    checked++;

    const approvedHit = approved
      .map((rendering) => findPhrase(derivedNorm, ctx.derived, rendering)[0])
      .find((match) => match !== undefined);

    if (approvedHit) {
      findings.push({
        layer: "L1",
        constraintId: constraint.id,
        kind: "isnad",
        cls: "preserved",
        start: approvedHit.start,
        end: approvedHit.end,
        span: approvedHit.text,
        evidence: {
          source: sourceHit,
          derived: approvedHit.text,
          note: `الدرجة أو الإحالة «${sourceHit}» نُقلت إلى المشتق بلفظ معتمد.`,
        },
      });
    } else {
      findings.push({
        layer: "L1",
        constraintId: constraint.id,
        kind: "isnad",
        cls: "missing",
        start: anchor,
        end: anchor,
        span: "",
        evidence: {
          source: sourceHit,
          derived: "",
          note: `الأصل يحمل «${sourceHit}» (درجة ثبوت أو إحالة)، والمشتق لا يحمل أي مقابل معتمد. نقل حديث بلا درجة ثبوته تغيير في قوة الاستدلال.`,
        },
      });
    }
  }

  coverage.push({
    layer: "L1",
    kind: "quote",
    reason:
      "مطابقة النص القرآني حرفاً بحرف غير مفعّلة في هذا البناء: تحتاج ربط النص العثماني المعتمد. أي اقتباس قرآني في المشتق غير مفحوص في هذه الطبقة.",
  });

  return { findings, coverage, checked };
}
