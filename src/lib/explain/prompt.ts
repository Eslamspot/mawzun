/**
 * Explainer prompt — plain-language reading of an audit verdict.
 *
 * Pure and deterministic: given the verdict, the decisive findings and the
 * approved constraints they cite, it builds the prompt the model must answer.
 * The model explains; it never re-judges. Citations are closed over the cited
 * constraint ids, so the model cannot invent a source.
 */

export interface ExplainFinding {
  readonly cls: string;
  readonly kind: string;
  readonly constraintId: string | null;
  readonly sourceSpan: string;
  readonly derivedSpan: string;
  readonly note: string;
}

export interface ExplainConstraint {
  readonly id: string;
  readonly label: string;
  readonly rule: string;
}

export interface ExplainInput {
  readonly verdict: string;
  readonly verdictLabel: string;
  readonly findings: readonly ExplainFinding[];
  readonly constraints: readonly ExplainConstraint[];
}

export const EXPLAIN_SYSTEM =
  "أنت شارح أحكام مقياس أمانة النقل (موزون). اشرح الحكم المعطى بلغة عربية بسيطة للمراجع البشري. ممنوع: إصدار حكم جديد، أو الفتوى، أو ترجيح مذهب، أو الاستشهاد بأي مصدر خارج قائمة القيود المعطاة. أجب بـ JSON فقط.";

export function buildExplainPrompt(input: ExplainInput): string {
  const findings =
    input.findings.length > 0
      ? input.findings
          .map(
            (f, i) =>
              `${i + 1}. [${f.cls}/${f.kind}] قيد: ${f.constraintId ?? "—"}\n   أصل: «${f.sourceSpan}»\n   مشتق: «${f.derivedSpan}»\n   ملاحظة: ${f.note}`,
          )
          .join("\n")
      : "لا وقائع حاسمة (الحكم مطابق).";

  const constraints =
    input.constraints.length > 0
      ? input.constraints.map((c) => `- ${c.id}: ${c.label} — ${c.rule}`).join("\n")
      : "لا قيود مستشهد بها.";

  return [
    "الحكم الصادر:",
    `${input.verdict} (${input.verdictLabel})`,
    "",
    "الوقائع الحاسمة:",
    findings,
    "",
    "القيود المستشهد بها (الاستشهاد المسموح الوحيد):",
    constraints,
    "",
    'أجب بـ JSON فقط بالشكل: {"explanation":"...","citations":["TRM-01",...]}',
    "قيود ملزمة:",
    "- explanation: شرح عربي مبسط لا يتجاوز 600 حرف، يفسّر لماذا صدر هذا الحكم من هذه الوقائع.",
    "- citations: معرفات من قائمة القيود أعلاه فقط، وكل معرف تستشهد به يجب أن يكون مذكورًا في الوقائع.",
    "- لا تضف أي حقل آخر، ولا أي نص خارج JSON.",
  ].join("\n");
}
