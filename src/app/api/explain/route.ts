import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  EXPLAIN_SYSTEM,
  buildExplainPrompt,
  type ExplainConstraint,
  type ExplainFinding,
} from "@/lib/explain/prompt";
import { parseExplainReply } from "@/lib/explain/parse";
import registry from "../../../../data/knowledge/1_القيود_المعتمدة.json";

/**
 * POST /api/explain — plain-language reading of an issued verdict.
 *
 * The body carries the verdict and its decisive findings (bounded); the route
 * resolves citations against `data/knowledge/` and calls Meta Model API with
 * the Worker secret `META_API_TOKEN`. The key never leaves the server, the
 * model explains but never re-judges, and every citation outside the cited
 * constraints rejects the whole reply.
 */

export const dynamic = "force-dynamic";

const MODEL = "muse-spark-1.3-contributor";
const MAX_FINDINGS = 20;
const MAX_SPAN = 500;

interface RegistryConstraint {
  id?: unknown;
  label_ar?: unknown;
  rule_ar?: unknown;
}

function readString(value: unknown, cap: number): string {
  return typeof value === "string" ? value.slice(0, cap) : "";
}

async function readMetaToken(): Promise<string | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    const env = ctx.env as unknown as { META_API_TOKEN?: unknown };
    return typeof env.META_API_TOKEN === "string" && env.META_API_TOKEN.length > 0
      ? env.META_API_TOKEN
      : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "الطلب ليس JSON صالحًا." }, { status: 400 });
  }

  const verdict = readString(body.verdict, 32);
  const verdictLabel = readString(body.verdictLabel, 64);
  if (!verdict) {
    return NextResponse.json({ ok: false, error: "الحكم مطلوب." }, { status: 400 });
  }

  const rawFindings = Array.isArray(body.findings) ? body.findings.slice(0, MAX_FINDINGS) : [];
  const findings: ExplainFinding[] = rawFindings.map((item) => {
    const f = (item ?? {}) as Record<string, unknown>;
    return {
      cls: readString(f.cls, 24),
      kind: readString(f.kind, 24),
      constraintId: typeof f.constraintId === "string" ? f.constraintId.slice(0, 24) : null,
      sourceSpan: readString(f.sourceSpan, MAX_SPAN),
      derivedSpan: readString(f.derivedSpan, MAX_SPAN),
      note: readString(f.note, MAX_SPAN),
    };
  });

  const citedIds = new Set(
    findings.map((f) => f.constraintId).filter((id): id is string => id !== null),
  );
  const allowed = new Map<string, string>();
  const constraints: ExplainConstraint[] = [];
  const all = (registry as { constraints?: RegistryConstraint[] }).constraints ?? [];
  for (const c of all) {
    if (typeof c.id === "string" && citedIds.has(c.id)) {
      const label = typeof c.label_ar === "string" ? c.label_ar : c.id;
      const rule = typeof c.rule_ar === "string" ? c.rule_ar : "";
      allowed.set(c.id, label);
      constraints.push({ id: c.id, label, rule });
    }
  }

  const token = await readMetaToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "مفتاح الشرح غير مضبوط (META_API_TOKEN). اضبطه كسرّ Worker ثم أعد المحاولة." },
      { status: 500 },
    );
  }

  const prompt = buildExplainPrompt({ verdict, verdictLabel, findings, constraints });

  let upstream: Response;
  try {
    upstream = await fetch("https://api.meta.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: EXPLAIN_SYSTEM },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: `تعذّر الوصول إلى النموذج: ${error instanceof Error ? error.message : String(error)}` },
      { status: 502 },
    );
  }

  let data: unknown = null;
  try {
    data = await upstream.json();
  } catch {
    // Non-JSON upstream body — surfaced below as a failure.
  }
  if (!upstream.ok) {
    const detail =
      typeof data === "string" ? data : JSON.stringify(data)?.slice(0, 300) ?? "empty body";
    return NextResponse.json(
      { ok: false, error: `النموذج أعاد ${upstream.status}: ${detail}` },
      { status: 502 },
    );
  }

  const raw =
    data && typeof data === "object"
      ? String(
          (data as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message
            ?.content ?? "",
        )
      : "";
  const { result, rejected } = parseExplainReply(raw, allowed);
  if (!result) {
    return NextResponse.json({ ok: false, error: rejected ?? "رُفض مخرج النموذج." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, model: MODEL, ...result });
}
