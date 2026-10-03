/**
 * Explainer reply parser — the trust boundary for model output.
 *
 * Accepts only JSON with a bounded Arabic explanation plus citations drawn
 * exclusively from the constraint ids the verdict actually cited. Anything
 * else is rejected with a reason the caller surfaces, never rendered.
 */

export interface ExplainCitation {
  readonly id: string;
  readonly label: string;
}

export interface ExplainResult {
  readonly explanation: string;
  readonly citations: readonly ExplainCitation[];
}

export function parseExplainReply(
  raw: string,
  allowed: ReadonlyMap<string, string>,
): { result: ExplainResult | null; rejected: string | null } {
  let parsed: unknown;
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    parsed = JSON.parse(start >= 0 && end > start ? raw.slice(start, end + 1) : raw);
  } catch {
    return { result: null, rejected: "مخرج النموذج ليس JSON صالحًا — رُفض الشرح." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { result: null, rejected: "مخرج النموذج لا يحمل كائنًا — رُفض الشرح." };
  }
  const obj = parsed as { explanation?: unknown; citations?: unknown };

  if (typeof obj.explanation !== "string" || obj.explanation.trim().length === 0) {
    return { result: null, rejected: "الشرح فارغ — رُفض." };
  }
  if (obj.explanation.length > 2000) {
    return { result: null, rejected: "الشرح تجاوز الحد (2000 حرف) — رُفض." };
  }
  if (!Array.isArray(obj.citations)) {
    return { result: null, rejected: "الاستشهادات ليست قائمة — رُفض الشرح." };
  }

  const citations: ExplainCitation[] = [];
  for (const id of obj.citations) {
    if (typeof id !== "string" || !allowed.has(id)) {
      return { result: null, rejected: `استشهاد غير مسموح: «${String(id)}» — رُفض الشرح.` };
    }
    citations.push({ id, label: allowed.get(id) ?? id });
  }

  return { result: { explanation: obj.explanation.trim(), citations }, rejected: null };
}
