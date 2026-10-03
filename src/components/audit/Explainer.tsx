"use client";

/**
 * Explainer — "اشرح هذا الحكم".
 *
 * Sends the issued verdict and its decisive findings to POST /api/explain and
 * renders the model's plain-language reading with its citations. The model
 * explains; the verdict on screen never changes. Local state only — nothing
 * here enters the sealed record.
 */

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { CodeChip, StatusChip } from "./parts";
import type { Finding } from "@/lib/audit/types";

interface Citation {
  id: string;
  label: string;
}

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "done"; explanation: string; citations: Citation[]; model: string }
  | { name: "error"; message: string };

export function Explainer({
  verdict,
  verdictLabel,
  findings,
}: {
  verdict: string;
  verdictLabel: string;
  findings: readonly Finding[];
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  async function explain() {
    setPhase({ name: "loading" });
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          verdictLabel,
          findings: findings.map((f) => ({
            cls: f.cls,
            kind: f.kind,
            constraintId: f.constraintId,
            sourceSpan: f.evidence.source,
            derivedSpan: f.evidence.derived,
            note: f.evidence.note,
          })),
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        explanation?: string;
        citations?: Citation[];
        model?: string;
        error?: string;
      };
      if (!data.ok) throw new Error(data.error ?? "فشل الشرح.");
      setPhase({
        name: "done",
        explanation: data.explanation ?? "",
        citations: data.citations ?? [],
        model: data.model ?? "",
      });
    } catch (error) {
      setPhase({
        name: "error",
        message: error instanceof Error ? error.message : "فشل الشرح.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-space-sm rounded-lg border border-gold/40 bg-gold-container/30 p-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <span className={cx(t.label, "flex items-center gap-space-xs font-semibold text-on-surface")}>
          <Icon name="psychology" className="text-lg text-on-gold-container" />
          شرح الحكم بلغة مبسطة
        </span>
        <button
          type="button"
          onClick={() => void explain()}
          disabled={phase.name === "loading"}
          className={cx(
            t.labelSm,
            "inline-flex cursor-pointer items-center gap-space-xs rounded-lg bg-primary-container px-space-md py-2 font-bold text-on-primary-container transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Icon name="auto_awesome" className="text-base" />
          {phase.name === "loading" ? "جارٍ الشرح…" : "اشرح هذا الحكم"}
        </button>
      </div>

      {phase.name === "loading" && (
        <div className="relative overflow-hidden rounded-xs bg-surface-container-lowest p-space-sm">
          <span
            aria-hidden="true"
            className="animate-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-l from-transparent via-gold/30 to-transparent"
          />
          <p className={cx(t.bodySm, "text-on-surface-variant")}>النموذج يقرأ الحكم ووقائعه…</p>
        </div>
      )}

      {phase.name === "error" && (
        <StatusChip tone="escalate" icon="error">
          {phase.message}
        </StatusChip>
      )}

      {phase.name === "done" && (
        <div className="flex flex-col gap-space-sm">
          <p className={cx(t.body, "leading-loose text-on-surface")}>{phase.explanation}</p>
          {phase.citations.length > 0 && (
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className={cx(t.labelSm, "text-on-surface-variant")}>الاستشهادات:</span>
              {phase.citations.map((c) => (
                <CodeChip key={c.id}>
                  {c.id} · {c.label}
                </CodeChip>
              ))}
            </div>
          )}
          <span className={cx(t.code, "text-on-surface-variant")}>
            شرح آلي عبر {phase.model} — يفسّر الحكم ولا يغيّره.
          </span>
        </div>
      )}

      {phase.name === "idle" && (
        <p className={cx(t.bodySm, "text-on-surface-variant")}>
          شرح مبسط للحكم ووقائعه من النموذج، مستشهدًا بقيود هذه الواقعة فقط.
        </p>
      )}
    </div>
  );
}
