"use client";

/**
 * Step 2 — القيود المعتمدة.
 *
 * The constraint bank, rendered as the design's governance table: what the
 * constraint is, where in the approved package it comes from, and which
 * renderings it allows or rules out. Nothing here is generated at runtime —
 * the table is the imported package, and the record carries the same bank.
 */

import { useMemo, useState } from "react";
import { buildConstraintBank } from "@/lib/audit";
import { useLang } from "@/context/LanguageContext";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { CodeChip, StatusChip, WorkflowCard } from "./parts";

const KIND_KEYS: Record<string, string> = {
  term: "f.term",
  ruling: "f.ruling",
  condition: "f.condition",
  isnad: "f.isnad",
  number: "f.number",
};

const FILTER_IDS = ["all", "term", "ruling", "condition", "isnad", "number"];

function renderings(list: Record<string, readonly string[]>): string {
  return (
    Object.entries(list)
      .filter(([, values]) => values.length > 0)
      .map(([language, values]) => `${language}: ${values.join(" · ")}`)
      .join("  |  ") || "—"
  );
}

export function ConstraintsSection() {
  const bank = useMemo(() => buildConstraintBank(), []);
  const [kind, setKind] = useState("all");
  const { s } = useLang();

  const rows = kind === "all" ? bank.constraints : bank.constraints.filter((c) => c.kind === kind);
  const kindLabel = (id: string) => (KIND_KEYS[id] ? s(KIND_KEYS[id]) : id);

  return (
    <WorkflowCard
      id="step-2"
      number={2}
      title={s("cs.title")}
      subtitle={s("cs.sub")}
      aside={
        <StatusChip tone="verified" icon="verified">
          {bank.packageName} · v{bank.version}
        </StatusChip>
      }
    >
      <div className="flex flex-wrap items-center gap-space-xs">
        {FILTER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cx(
              t.labelSm,
              "rounded-xs px-space-sm py-1 font-medium transition-colors",
              kind === id
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container",
            )}
          >
            {id === "all" ? s("f.all") : kindLabel(id)}
          </button>
        ))}
        <span className={cx(t.code, "ms-auto text-on-surface-variant")}>
          {rows.length} / {bank.constraints.length} {s("cs.count")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-end">
          <thead>
            <tr className={cx(t.labelSm, "bg-surface-container-low text-on-surface-variant")}>
              <th className="rounded-s px-space-md py-2.5">{s("cs.th.kind")}</th>
              <th className="px-space-md py-2.5">{s("cs.th.rule")}</th>
              <th className="px-space-md py-2.5">{s("cs.th.origin")}</th>
              <th className="rounded-e px-space-md py-2.5">{s("cs.th.rend")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((constraint) => (
              <tr
                key={constraint.id}
                className="align-top transition-colors hover:bg-surface-container-low/50"
              >
                <td className="px-space-md py-space-md">
                  <span
                    className={cx(
                      t.labelSm,
                      "inline-flex rounded-xs bg-surface-container px-space-sm py-0.5 font-medium text-on-surface",
                    )}
                  >
                    {kindLabel(constraint.kind)}
                  </span>
                  <div className={cx(t.code, "mt-1 text-outline")}>{constraint.id}</div>
                </td>
                <td className="px-space-md py-space-md">
                  <p className={cx(t.body, "text-on-surface")}>{constraint.rule}</p>
                  {constraint.source.length > 0 && (
                    <p className={cx(t.code, "mt-1 text-on-surface-variant")}>
                      {constraint.source.join(" · ")}
                    </p>
                  )}
                </td>
                <td className={cx(t.code, "px-space-md py-space-md text-on-surface-variant")}>
                  {constraint.origin}
                </td>
                <td className="px-space-md py-space-md">
                  <div className="flex flex-col gap-1">
                    <span className={cx(t.code, "text-on-tertiary-fixed-variant")}>
                      {s("cs.approved")} {renderings(constraint.approved)}
                    </span>
                    <span className={cx(t.code, "text-error")}>
                      {s("cs.forbidden")} {renderings(constraint.forbidden)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cx(t.bodySm, "flex items-center gap-space-xs text-on-surface-variant")}>
        <CodeChip>bank@{bank.version}</CodeChip>
        <span>{s("cs.foot")}</span>
      </div>
    </WorkflowCard>
  );
}
