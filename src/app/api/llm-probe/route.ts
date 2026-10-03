import { NextResponse } from "next/server";

/**
 * POST /api/llm-probe — diagnostic only, not part of the product.
 *
 * Calls Meta Model API (`muse-spark-1.3-contributor`) with the Worker secret
 * `META_API_TOKEN` and returns a short reply. The key never leaves the
 * server: it is read from the Worker env, never logged, never echoed.
 * Remove this route once the explainer provider lands.
 */

export const dynamic = "force-dynamic";

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

export async function POST() {
  const token = await readMetaToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "META_API_TOKEN is missing in the Worker environment." },
      { status: 500 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.meta.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "muse-spark-1.3-contributor",
        messages: [{ role: "user", content: "Reply with one Arabic word." }],
        max_tokens: 200,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: `network failure: ${error instanceof Error ? error.message : String(error)}` },
      { status: 502 },
    );
  }

  let data: unknown = null;
  try {
    data = await upstream.json();
  } catch {
    // Non-JSON upstream body — handled below as an error payload.
  }

  if (!upstream.ok) {
    const detail =
      typeof data === "string" ? data : JSON.stringify(data)?.slice(0, 300) ?? "empty body";
    return NextResponse.json(
      { ok: false, status: upstream.status, error: detail },
      { status: 502 },
    );
  }

  const reply =
    data && typeof data === "object"
      ? String(
          (data as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message
            ?.content ?? "",
        ).slice(0, 200)
      : "";
  return NextResponse.json({ ok: true, model: "muse-spark-1.3-contributor", reply });
}
