"use client";

/**
 * Step 3 — الفحص ثلاثي الطبقات.
 *
 * The three layers are shown side by side and never blended into one number,
 * because each carries a different strength of proof: the first two are lookups
 * over imported tables and cannot be argued with, the third is a model's
 * structured findings gated on verbatim quotes.
 *
 * The four questions of the semantic layer are answered from the findings
 * themselves. When the layer did not run, each question says so — an unchecked
 * question must never read as a passed one.
 */

import { useAudit } from "@/context/AuditContext";
import { useLang } from "@/context/LanguageContext";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import type { Finding, LayerId } from "@/lib/audit/types";
import {
  CodeChip,
  FINDING_TONE,
  HighlightedText,
  InsetPanel,
  StatusChip,
  WorkflowCard,
} from "./parts";

const LAYERS: { id: LayerId; ordinalKey: string; titleKey: string; noteKey: string }[] = [
  {
    id: "L1",
    ordinalKey: "pl.l1.o",
    titleKey: "pl.l1.t",
    noteKey: "pl.l1.x",
  },
  {
    id: "L2",
    ordinalKey: "pl.l2.o",
    titleKey: "pl.l2.t",
    noteKey: "pl.l2.x",
  },
  {
    id: "L3",
    ordinalKey: "pl.l3.o",
    titleKey: "pl.l3.t",
    noteKey: "pl.l3.x",
  },
];

const QUESTIONS: { kind: Finding["kind"]; key: string }[] = [
  { kind: "condition", key: "pl.q.condition" },
  { kind: "isnad", key: "pl.q.isnad" },
  { kind: "ruling", key: "pl.q.ruling" },
  { kind: "term", key: "pl.q.term" },
];

const FINDING_STATE: Record<Finding["cls"], string> = {
  preserved: "st.preserved",
  shifted: "st.shifted",
  missing: "st.missing",
};

export function PipelineSection() {
  const audit = useAudit();
  const { s } = useLang();
  const result = audit.result;
  const l3Ran = audit.record?.model?.id != null;
  const layerFindings = (layer: LayerId) => result?.findings.filter((f) => f.layer === layer) ?? [];

  const coverage = result?.coverage ?? [];

  return (
    <WorkflowCard
      id="step-3"
      number={3}
      title={s("pl.title")}
      subtitle={s("pl.sub")}
      aside={
        <span className={cx(t.code, "flex items-center gap-space-sm text-on-surface-variant")}>
          <span
            className={cx(
              "h-2 w-2 rounded-full",
              audit.isRunning ? "animate-pulse bg-secondary" : result ? "bg-tertiary-container" : "bg-outline",
            )}
          />
          {audit.isRunning
            ? s("pl.running")
            : result
              ? `${s("pl.done")} · ${result.findings.length} ${s("pl.findings")}`
              : s("pl.idle")}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {LAYERS.map((layer) => {
          const summary = result?.layerSummary[layer.id];
          const findings = layerFindings(layer.id);
          const ran = layer.id !== "L3" || l3Ran;
          const hasIssue = (summary?.shifted ?? 0) + (summary?.missing ?? 0) > 0;

          return (
            <div
              key={layer.id}
              className="flex flex-col justify-between gap-space-md rounded-xl border border-outline-variant bg-surface-container-low p-space-lg"
            >
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className={cx(t.labelSm, "font-semibold text-primary")}>{s(layer.ordinalKey)}</span>
                  {!result ? (
                    <StatusChip tone="neutral">{s("pl.pending")}</StatusChip>
                  ) : !ran ? (
                    <StatusChip tone="neutral" icon="help">
                      {s("pl.off")}
                    </StatusChip>
                  ) : hasIssue ? (
                    <StatusChip tone="escalate">
                      {summary?.shifted ?? 0} {s("pl.shift")} · {summary?.missing ?? 0} {s("pl.miss")}
                    </StatusChip>
                  ) : (
                    <StatusChip tone="verified" icon="check">
                      {s("pl.clean")}
                    </StatusChip>
                  )}
                </div>

                <h3 className={cx(t.h4, "text-on-surface")}>{s(layer.titleKey)}</h3>
                <p className={cx(t.bodySm, "text-on-surface-variant")}>{s(layer.noteKey)}</p>

                {layer.id === "L3" ? (
                  <div className="mt-space-sm flex flex-col gap-space-xs">
                    {QUESTIONS.map((question) => {
                      const hits = findings.filter((f) => f.kind === question.kind && f.cls !== "preserved");
                      const preserved = findings.filter((f) => f.kind === question.kind && f.cls === "preserved");
                      return (
                        <InsetPanel key={question.key} className="bg-surface-container-lowest">
                          <div className={cx(t.labelSm, "font-semibold text-on-surface")}>{s(question.key)}</div>
                          {!l3Ran ? (
                            <div className={cx(t.bodySm, "text-on-surface-variant")}>{s("pl.q.off")}</div>
                          ) : hits.length > 0 ? (
                            <div className={cx(t.bodySm, "text-error")}>
                              {hits
                                .map((f) => f.evidence.note || `${s(FINDING_STATE[f.cls])}: ${f.span}`)
                                .join(" · ")}
                            </div>
                          ) : preserved.length > 0 ? (
                            <div className={cx(t.bodySm, "text-on-tertiary-fixed-variant")}>
                              {s("pl.q.keep")} {preserved.map((f) => f.span).join(" · ")}
                            </div>
                          ) : (
                            <div className={cx(t.bodySm, "text-on-surface-variant")}>{s("pl.q.none")}</div>
                          )}
                        </InsetPanel>
                      );
                    })}
                  </div>
                ) : (
                  <InsetPanel className="bg-surface-container-lowest">
                    {findings.length === 0 ? (
                      <div className={cx(t.code, "text-on-surface-variant")}>
                        {result ? s("pl.layer.none") : s("pl.pending")}
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {findings.slice(0, 4).map((finding, index) => (
                          <li key={index} className={cx(t.code, "flex items-center justify-between gap-space-xs")}>
                            <span className="truncate text-on-surface-variant">{finding.span || "—"}</span>
                            <span
                              className={
                                finding.cls === "preserved" ? "text-on-tertiary-fixed-variant" : "text-error"
                              }
                            >
                              {s(FINDING_STATE[finding.cls])}
                            </span>
                          </li>
                        ))}
                        {findings.length > 4 && (
                          <li className={cx(t.code, "text-outline")}>
                            {s("pl.more.pre")}
                            {findings.length - 4} {s("pl.more.post")}
                          </li>
                        )}
                      </ul>
                    )}
                  </InsetPanel>
                )}
              </div>

              <div className={cx(t.code, "pt-space-md text-on-surface-variant")}>
                {layer.id === "L1" && "DET-QUOTE+NUMERIC"}
                {layer.id === "L2" && "LEXICON+FORCE-TABLE"}
                {layer.id === "L3" && (audit.record?.model?.id ?? "MODEL-NOT-RUN")}
              </div>
            </div>
          );
        })}
      </div>

      {result && (
        <>
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className={cx(t.label, "font-semibold text-on-surface")}>{s("pl.drv")}</span>
              <CodeChip>
                {result.findings.filter((f) => f.end > f.start).length} {s("pl.spots")}
              </CodeChip>
            </div>
            <InsetPanel>
              <HighlightedText text={audit.derivedText} findings={result.findings} />
            </InsetPanel>
          </div>

          {result.findings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-end">
                <thead>
                  <tr className={cx(t.labelSm, "bg-surface-container-low text-on-surface-variant")}>
                    <th className="rounded-s px-space-md py-2 font-semibold">{s("pl.f.layer")}</th>
                    <th className="px-space-md py-2 font-semibold">{s("pl.f.kind")}</th>
                    <th className="px-space-md py-2 font-semibold">{s("pl.f.state")}</th>
                    <th className="px-space-md py-2 font-semibold">{s("pl.f.span")}</th>
                    <th className="rounded-e px-space-md py-2 font-semibold">{s("pl.f.fact")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.findings.map((finding, index) => (
                    <tr key={index} className="border-t border-surface-container-high align-top">
                      <td className={cx(t.code, "px-space-md py-space-sm text-on-surface-variant")}>
                        {finding.layer}
                      </td>
                      <td className={cx(t.bodySm, "px-space-md py-space-sm text-on-surface")}>
                        {finding.kind}
                      </td>
                      <td className="px-space-md py-space-sm">
                        <StatusChip tone={FINDING_TONE[finding.cls]}>{s(FINDING_STATE[finding.cls])}</StatusChip>
                      </td>
                      <td className={cx(t.code, "px-space-md py-space-sm text-on-surface-variant")}>
                        {finding.end > finding.start ? `${finding.start}:${finding.end}` : "—"}
                      </td>
                      <td className="px-space-md py-space-sm">
                        <p className={cx(t.bodySm, "text-on-surface")}>
                          {finding.evidence.note}
                        </p>
                        {finding.span && (
                          <p dir="auto" className={cx(t.codeMd, "mt-1 text-on-surface-variant")}>
                            «{finding.span}»
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-space-md">
            <div className={cx(t.label, "mb-space-xs font-semibold text-on-surface")}>{s("pl.cov")}</div>
            {coverage.length === 0 ? (
              <p className={cx(t.bodySm, "text-on-surface-variant")}>{s("pl.cov.none")}</p>
            ) : (
              <ul className="flex flex-col gap-space-xs">
                {coverage.map((note, index) => (
                  <li key={index} className="flex items-start gap-space-sm">
                    <CodeChip>{note.layer}</CodeChip>
                    <span className={cx(t.bodySm, "text-on-surface-variant")}>{note.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </WorkflowCard>
  );
}
