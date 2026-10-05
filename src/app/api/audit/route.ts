/**
 * POST /api/audit — run the audit engine on the server.
 *
 * The engine itself is deterministic and pure; the only reason this route exists
 * is layer 3, which needs a model. Cloudflare Workers AI is reached through the
 * `AI` binding declared in wrangler.jsonc, so no API key is involved.
 *
 * When the binding is unavailable — local `next dev`, a preview without the
 * binding, a provider outage — the route does NOT fail and does NOT silently
 * pass: it falls back to the declared-gap provider, so the verdict states that
 * the semantic layer did not run. An absent layer must never look like a passed
 * layer.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildConstraintBank,
  declaredGapProvider,
  modelProvider,
  runAudit,
  sha256Hex,
  buildSemanticPrompt,
  type SemanticProvider,
} from "@/lib/audit";
import type { AuditInput, ContentLevel, WorkType } from "@/lib/audit/types";

export const dynamic = "force-dynamic";

/**
 * Candidate models, tried in order.
 *
 * The first is the repository's existing choice; the second is a standard-tier
 * model, because a chain of paid-tier models shares one narrow rate limit and
 * co-located models fail together on a capacity wave.
 */
const GENERATION_MODELS = ["@cf/google/gemma-4-26b-a4b-it", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"] as const;

/** Attempts per model, with the backoff between them. */
const ATTEMPTS_PER_MODEL = 2;
const BACKOFF_MS = [500];

/** A hung model must never hold the whole audit past this ceiling. */
const MODEL_ATTEMPT_TIMEOUT_MS = 40000;

interface WorkersAiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Reach the Workers AI binding without letting a missing binding throw. */
async function getAiBinding(): Promise<WorkersAiBinding | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    const env = ctx.env as unknown as { AI?: WorkersAiBinding };
    return env.AI ?? null;
  } catch {
    return null;
  }
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "الطلب ليس JSON صالحًا." }, { status: 400 });
  }

  const sourceText = readString(body.sourceText).trim();
  const derivedText = readString(body.derivedText).trim();

  if (!sourceText || !derivedText) {
    return NextResponse.json(
      { ok: false, error: "النص الأصلي والنص المشتق مطلوبان معًا." },
      { status: 400 },
    );
  }

  const input: AuditInput = {
    sourceText,
    derivedText,
    workType: (readString(body.workType, "translate") as WorkType) ?? "translate",
    contentLevel: (readString(body.contentLevel, "B") as ContentLevel) ?? "B",
    targetLanguage: readString(body.targetLanguage, "en"),
    bank: buildConstraintBank(),
    reviewerDecision: readString(body.reviewerDecision) || null,
  };

  const binding = await getAiBinding();
  let semantic: SemanticProvider;

  if (binding) {
    // Narrowed once: the closures below capture `ai`, never the nullable binding.
    const ai = binding;
    semantic = modelProvider(async (prompt) => {
      const promptHash = await sha256Hex(prompt);
      const attempts: string[] = [];

      async function callOnce(model: string, input: Record<string, unknown>) {
        const response = await ai.run(model, input);
        return extractText(response);
      }

      function withTimeout(model: string, task: Promise<string>): Promise<string> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const ceiling = new Promise<string>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${model}: انتهت المهلة (${MODEL_ATTEMPT_TIMEOUT_MS / 1000} ث)`)),
            MODEL_ATTEMPT_TIMEOUT_MS,
          );
        });
        return Promise.race([task, ceiling]).finally(() => clearTimeout(timer));
      }

      // One racer per model: up to ATTEMPTS_PER_MODEL tries (empty replies are
      // retried, transport errors fail that racer fast). The first valid
      // non-empty reply wins, so a slow model never blocks a fast one.
      async function raceModel(
        model: (typeof GENERATION_MODELS)[number],
      ): Promise<{ raw: string; model: string; promptHash: string }> {
        let lastError: unknown = null;
        for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
          try {
            const raw = await withTimeout(
              model,
              callOnce(model, {
                messages: [
                  { role: "system", content: "أجب بـ JSON فقط دون أي نص إضافي." },
                  { role: "user", content: prompt },
                ],
                // A reasoning model bills its thinking against this ceiling, so a
                // tight budget returns finish_reason "length" with empty content.
                max_tokens: 2048,
              }),
            );

            // HTTP-level success with empty content is a failure, not a result:
            // routing it on would make the operator think the model answered.
            if (raw.trim().length === 0) {
              attempts.push(`${model}: رد فارغ`);
              lastError = new Error(`${model} أعاد ردًا فارغًا`);
              if (attempt < ATTEMPTS_PER_MODEL - 1) await sleep(BACKOFF_MS[attempt] ?? 500);
              continue;
            }

            return { raw, model, promptHash };
          } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            attempts.push(`${model}: ${detail.slice(0, 80)}`);
            lastError = error;
            break;
          }
        }
        throw lastError instanceof Error ? lastError : new Error(`${model}: فشل غير معروف`);
      }

      try {
        const winner = await Promise.any(GENERATION_MODELS.map((model) => raceModel(model)));
        console.log(`audit L3 answered by ${winner.model} — ${attempts.join(" | ")}`);
        return winner;
      } catch {
        // Every candidate failed. The engine turns this into a declared gap,
        // so the verdict states that the semantic layer did not run rather
        // than presenting a deterministic-only result as complete.
        throw new Error(
          `كل النماذج المرشحة فشلت (${GENERATION_MODELS.join(", ")}). المحاولات: ${attempts.join(" | ")}`,
        );
      }
    });
  } else {
    semantic = declaredGapProvider(
      "الطبقة الدلالية لم تُشغَّل: ربط النموذج (AI binding) غير متاح في هذه البيئة. ما كان يمكن كشفه بالاستدلال الدلالي غير مفحوص.",
    );
  }

  try {
    // The prompt hash is computed even on the declared-gap path, so the record
    // always names the prompt that would have been used.
    void buildSemanticPrompt({
      source: input.sourceText,
      derived: input.derivedText,
      language: input.targetLanguage,
      level: input.contentLevel,
      bank: input.bank,
    });

    const { result, record, rejected, alignment } = await runAudit(input, { semantic });
    return NextResponse.json({ ok: true, result, record, rejected, alignment });
  } catch (error) {
    console.error("audit route failed", error);
    return NextResponse.json({ ok: false, error: "فشل تنفيذ الفحص على الخادم." }, { status: 500 });
  }
}

/**
 * Read the answer out of a Workers AI reply.
 *
 * The shape differs by model family: `response` for the text-generation models,
 * and an OpenAI-style `choices[0].message.content` for the chat ones. The
 * reasoning stream is ignored on purpose — it is not the answer.
 */
function extractText(response: unknown): string {
  if (typeof response === "string") return response;
  if (response && typeof response === "object") {
    const r = response as {
      response?: unknown;
      result?: unknown;
      choices?: { message?: { content?: unknown } }[];
    };
    if (typeof r.response === "string") return r.response;
    if (typeof r.result === "string") return r.result;

    const content = r.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
  }
  return "";
}
