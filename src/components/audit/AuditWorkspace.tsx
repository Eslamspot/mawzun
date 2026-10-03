"use client";

/**
 * The five-step workspace: inputs, constraint bank, check, verdict, record.
 *
 * Each route renders the same component with a different `step`, so the sidebar,
 * the breadcrumb and this header all read from `lib/stages.ts` and cannot drift.
 *
 * Design rules the UI obeys, because they are the product:
 * - every finding shows its reason, its location and its evidence;
 * - the three layers are never blended into one number;
 * - what was NOT checked is shown next to what was;
 * - "refer" is presented as a designed outcome, not as an error state.
 */

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/ui/PageShell";
import { useAudit } from "@/context/AuditContext";
import { buildConstraintBank } from "@/lib/audit";
import { cx } from "@/lib/cx";
import { STAGES, nextStage, previousStage, stageHref } from "@/lib/stages";
import { t } from "@/lib/typography";
import type { ContentLevel, Finding, WorkType } from "@/lib/audit/types";

export type Step = "input" | "constraints" | "check" | "verdict" | "record";

const STEP_TO_SLUG: Record<Step, string> = {
  input: "01-input",
  constraints: "02-constraints",
  check: "03-check",
  verdict: "04-verdict",
  record: "05-record",
};

const KIND_LABEL: Record<string, string> = {
  term: "المصطلح",
  ruling: "قوة الحكم",
  condition: "الشرط",
  isnad: "السند",
  number: "الأرقام",
  reference: "الإحالة",
  quote: "الاقتباس",
};

const CLASS_TONE = {
  preserved: { tone: "primary" as const, label: "محفوظ" },
  shifted: { tone: "error" as const, label: "منزاح" },
  missing: { tone: "tertiary" as const, label: "مفقود" },
};

const LEVELS: { id: ContentLevel; label: string; hint: string }[] = [
  { id: "A", label: "أ — نصوص أصلية مستقرة", hint: "نقل حرفي بلا اجتهاد" },
  { id: "B", label: "ب — شرح وتفسير", hint: "يُعرض المرجع مع المعلومة" },
  { id: "C", label: "ج — مسائل خلافية", hint: "يُبيَّن الخلاف أو يُحال، بلا ترجيح" },
  { id: "D", label: "د — فتوى أو حالة شخصية", hint: "لا حكم؛ وقف وتحويل إلى أهل العلم" },
];

const WORK_TYPES: { id: WorkType; label: string }[] = [
  { id: "translate", label: "ترجمة" },
  { id: "summarize", label: "تلخيص" },
  { id: "paraphrase", label: "إعادة صياغة" },
];

const EXAMPLE = {
  sourceText: "لا يجوز بيع الطعام قبل قبضه، ويجب على البائع بيانه للمشتري.",
  derivedText:
    "It is not recommended to sell food before taking possession, and the seller must clarify it to the buyer.",
};

export function AuditWorkspace({ step }: { step: Step }) {
  const audit = useAudit();
  const slug = STEP_TO_SLUG[step];
  const current = STAGES.find((s) => s.slug === slug) ?? STAGES[0];
  const prev = previousStage(current);
  const next = nextStage(current);

  return (
    <PageShell width="7xl">
      <header className="flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className={cx(t.h1, "font-bold tracking-tight text-on-surface")}>موزون</span>
          <Badge tone="outline">مقياس أمانة النقل</Badge>
        </div>
        <p className={cx(t.bodyLg, "max-w-3xl leading-relaxed text-on-surface-variant")}>
          يقيس موزون أمانة نقل المعنى بين نص شرعي أصلي ونص مشتق منه. لا يفتي، ولا يرجّح مذهبًا، ولا يحكم على
          صحة رأي — بل يسأل: هل بقي المعنى كما هو؟
        </p>
      </header>

      <StepRail current={slug} />

      {step === "input" && <InputStep onLoadExample={() => {
        audit.setSourceText(EXAMPLE.sourceText);
        audit.setDerivedText(EXAMPLE.derivedText);
        audit.setContentLevel("B");
        audit.setWorkType("translate");
      }} />}
      {step === "constraints" && <ConstraintsStep />}
      {step === "check" && <CheckStep />}
      {step === "verdict" && <VerdictStep />}
      {step === "record" && <RecordStep />}

      <nav className="flex items-center justify-between gap-space-sm pt-space-sm">
        {prev ? (
          <Link
            href={stageHref(prev.slug)}
            className="inline-flex items-center gap-1 rounded-lg border border-surface-container-high px-space-md py-space-xs text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="chevron_right" className="text-base" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={stageHref(next.slug)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-space-md py-space-xs text-sm font-semibold text-on-primary hover:opacity-90"
          >
            {next.title}
            <Icon name="chevron_left" className="text-base" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </PageShell>
  );
}

function StepRail({ current }: { current: string }) {
  return (
    <ol className="flex flex-wrap items-center gap-space-xs">
      {STAGES.map((stage) => {
        const isActive = stage.slug === current;
        const isDone = STAGES.findIndex((s) => s.slug === stage.slug) < STAGES.findIndex((s) => s.slug === current);
        return (
          <li key={stage.slug}>
            <Link
              href={stageHref(stage.slug)}
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-space-sm py-1 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : isDone
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              <Icon name={isActive || isDone ? stage.doneIcon : stage.icon} className="text-sm" />
              {stage.ordinal} {stage.title}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-surface-container-high pb-space-xs">
      <h2 className={cx(t.h3, "font-semibold text-on-surface")}>{title}</h2>
      {hint && <p className={cx(t.bodySm, "text-on-surface-variant")}>{hint}</p>}
    </div>
  );
}

function InputStep({ onLoadExample }: { onLoadExample: () => void }) {
  const audit = useAudit();

  return (
    <div className="flex flex-col gap-space-lg">
      <SectionTitle title="المدخلات الأربعة" hint="النص الأصلي، والنص المشتق، ونوع العمل، ومستوى المحتوى." />

      <div className="grid gap-space-md lg:grid-cols-2">
        <Card className="flex flex-col gap-space-xs p-space-md">
          <label htmlFor="source" className={cx(t.labelSm, "font-semibold text-on-surface")}>
            النص الأصلي
          </label>
          <textarea
            id="source"
            dir="rtl"
            rows={6}
            value={audit.sourceText}
            onChange={(e) => audit.setSourceText(e.target.value)}
            placeholder="الصق النص الشرعي الأصلي هنا."
            className="w-full resize-y rounded-lg border border-surface-container-high bg-surface-container-lowest p-space-sm font-body-md text-body-md text-on-surface outline-none focus:border-primary"
          />
          <span className={cx(t.code, "text-outline")}>{audit.sourceText.trim().split(/\s+/).filter(Boolean).length} كلمة</span>
        </Card>

        <Card className="flex flex-col gap-space-xs p-space-md">
          <label htmlFor="derived" className={cx(t.labelSm, "font-semibold text-on-surface")}>
            النص المشتق
          </label>
          <textarea
            id="derived"
            dir="ltr"
            rows={6}
            value={audit.derivedText}
            onChange={(e) => audit.setDerivedText(e.target.value)}
            placeholder="Paste the translation / summary / paraphrase here."
            className="w-full resize-y rounded-lg border border-surface-container-high bg-surface-container-lowest p-space-sm font-body-md text-body-md text-on-surface outline-none focus:border-primary"
          />
          <span className={cx(t.code, "text-outline")}>{audit.derivedText.trim().split(/\s+/).filter(Boolean).length} كلمة</span>
        </Card>
      </div>

      <div className="grid gap-space-md lg:grid-cols-2">
        <Card className="flex flex-col gap-space-sm p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>نوع العمل</span>
          <div className="flex flex-wrap gap-space-xs">
            {WORK_TYPES.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => audit.setWorkType(w.id)}
                className={cx(
                  "rounded-lg px-space-md py-1.5 text-sm font-semibold transition-colors",
                  audit.workType === w.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-space-sm p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>اللغة الهدف</span>
          <select
            value={audit.targetLanguage}
            onChange={(e) => audit.setTargetLanguage(e.target.value)}
            className="rounded-lg border border-surface-container-high bg-surface-container-lowest px-space-sm py-1.5 text-sm text-on-surface"
          >
            <option value="en">الإنجليزية</option>
            <option value="fr">الفرنسية</option>
          </select>
          <p className={cx(t.bodySm, "text-on-surface-variant")}>
            بنك القيود يحمل حاليًا مقابلات معتمدة لهاتين اللغتين. اللغات الأخرى تُضاف بتوسيع الجدول لا بتعديل المحرك.
          </p>
        </Card>
      </div>

      <Card className="flex flex-col gap-space-sm p-space-md">
        <span className={cx(t.labelSm, "font-semibold text-on-surface")}>مستوى المحتوى</span>
        <div className="grid gap-space-xs sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => audit.setContentLevel(level.id)}
              className={cx(
                "flex flex-col gap-0.5 rounded-lg border p-space-sm text-right transition-colors",
                audit.contentLevel === level.id
                  ? "border-primary bg-primary/5"
                  : "border-surface-container-high hover:bg-surface-container",
              )}
            >
              <span className="text-sm font-semibold text-on-surface">{level.label}</span>
              <span className={cx(t.bodySm, "text-on-surface-variant")}>{level.hint}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-space-sm">
        <button
          type="button"
          onClick={audit.run}
          disabled={audit.isRunning || !audit.sourceText.trim() || !audit.derivedText.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-space-md py-space-xs text-sm font-semibold text-on-primary disabled:opacity-40"
        >
          <Icon name="play_arrow" className="text-base" />
          {audit.isRunning ? "جارٍ الفحص…" : "نفّذ الفحص"}
        </button>
        <button
          type="button"
          onClick={onLoadExample}
          className="inline-flex items-center gap-1 rounded-lg border border-surface-container-high px-space-md py-space-xs text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="experiment" className="text-base" />
          حمّل مثال الانزياح
        </button>
        <button
          type="button"
          onClick={audit.reset}
          className="inline-flex items-center gap-1 rounded-lg px-space-sm py-space-xs text-sm text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="restart_alt" className="text-base" />
          تهيئة
        </button>
      </div>

      {audit.error && (
        <Card className="border-error-container bg-error-container/40 p-space-md">
          <p className={cx(t.bodySm, "text-on-error-container")}>{audit.error}</p>
        </Card>
      )}
    </div>
  );
}

const BANK_KINDS: { id: string; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "term", label: "المصطلح" },
  { id: "ruling", label: "الحكم" },
  { id: "condition", label: "الشرط" },
  { id: "isnad", label: "السند" },
  { id: "number", label: "الأرقام" },
];

function ConstraintsStep() {
  const bank = useMemo(() => buildConstraintBank(), []);
  const [kind, setKind] = useState("all");

  const rows = kind === "all" ? bank.constraints : bank.constraints.filter((c) => c.kind === kind);

  return (
    <div className="flex flex-col gap-space-lg">
      <SectionTitle
        title="بنك القيود"
        hint="خمسة أنواع من القيود، مستوردة من الحزمة العلمية المعتمدة لا من رأي النظام. لكل قيد أصله."
      />

      <Card className="flex flex-col gap-space-xs p-space-md">
        <div className="flex flex-wrap items-center gap-space-xs">
          <Badge tone="outline">البنك: {bank.packageName}</Badge>
          <Badge tone="outline">الإصدار {bank.version}</Badge>
          <Badge tone="primary">{bank.constraints.length} قيدًا</Badge>
        </div>
        <p className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>
          السجل يحمل نسخة البنك وإصداره كاملين، فلا يمكن أن يتغيّر قيد دون أن يتغيّر السجل.
        </p>
      </Card>

      <div className="flex flex-wrap gap-space-xs">
        {BANK_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cx(
              "rounded-lg px-space-sm py-1 text-xs font-semibold transition-colors",
              kind === k.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-space-xs">
        {rows.map((c) => (
          <li key={c.id}>
            <Card className="flex flex-col gap-space-xs p-space-sm">
              <div className="flex flex-wrap items-center gap-space-xs">
                <Badge tone="outline">{KIND_LABEL[c.kind] ?? c.kind}</Badge>
                <span className={cx(t.code, "text-outline")}>{c.id}</span>
              </div>

              <div className="flex flex-wrap items-center gap-space-xs">
                {c.source.map((form) => (
                  <span key={form} className={cx(t.bodySm, "rounded bg-surface-container px-1.5 py-0.5 text-on-surface")}>
                    {form}
                  </span>
                ))}
              </div>

              <p className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>{c.rule}</p>

              <div className="grid gap-space-xs sm:grid-cols-2">
                <div>
                  <span className={cx(t.code, "text-outline")}>مقابلات معتمدة</span>
                  <p dir="ltr" className={cx(t.bodySm, "text-on-surface")}>
                    {Object.entries(c.approved)
                      .filter(([, list]) => list.length > 0)
                      .map(([lang, list]) => `${lang}: ${list.join(", ")}`)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <div>
                  <span className={cx(t.code, "text-outline")}>مقابلات ممنوعة</span>
                  <p dir="ltr" className={cx(t.bodySm, "text-on-surface")}>
                    {Object.entries(c.forbidden)
                      .filter(([, list]) => list.length > 0)
                      .map(([lang, list]) => `${lang}: ${list.join(", ")}`)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </div>

              <p className={cx(t.code, "text-outline")}>الأصل: {c.origin}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckStep() {
  const audit = useAudit();
  const result = audit.result;

  if (!result) {
    return (
      <div className="flex flex-col gap-space-lg">
        <SectionTitle title="الفحص بثلاث طبقات" hint="لم يُنفَّذ فحص بعد." />
        <Card className="p-space-lg">
          <p className={cx(t.body, "text-on-surface-variant")}>
            املأ المدخلات الأربعة في الخطوة الأولى ثم نفّذ الفحص.
          </p>
        </Card>
      </div>
    );
  }

  const layers = [
    { id: "L1" as const, name: "الطبقة الأولى — حتمية", hint: "النص القرآني والأرقام والإحالات: مقارنة حرفية بلا ذكاء اصطناعي." },
    { id: "L2" as const, name: "الطبقة الثانية — معجمية", hint: "المسرد والمصطلح وقوة الحكم والشرط: بحث في جداول معتمدة." },
    { id: "L3" as const, name: "الطبقة الثالثة — دلالية", hint: "وقائع منظّمة من نموذج، والحكم عليها بقاعدة حتمية." },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <SectionTitle
        title="الفحص بثلاث طبقات"
        hint="كل طبقة معروضة على حدة. لا يُدمج الفحص في رقم واحد، لأن لكل طبقة قوة إثبات مختلفة."
      />

      <div className="grid gap-space-sm lg:grid-cols-3">
        {layers.map((layer) => {
          const s = result.layerSummary[layer.id];
          return (
            <Card key={layer.id} className="flex flex-col gap-space-xs p-space-md">
              <span className="text-sm font-semibold text-on-surface">{layer.name}</span>
              <p className={cx(t.bodySm, "text-on-surface-variant")}>{layer.hint}</p>
              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                <Badge tone="outline">{s.checked} فحصًا</Badge>
                {s.shifted > 0 && <Badge tone="error">{s.shifted} انزياح</Badge>}
                {s.missing > 0 && <Badge tone="tertiary">{s.missing} مفقود</Badge>}
                {s.shifted === 0 && s.missing === 0 && <Badge tone="primary">لا مخالفة</Badge>}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-col gap-space-sm p-space-md">
        <span className={cx(t.labelSm, "font-semibold text-on-surface")}>النص المشتق بمواضع الانزياح</span>
        <HighlightedText text={audit.derivedText} findings={result.findings} />
      </Card>

      <div className="flex flex-col gap-space-sm">
        <span className={cx(t.labelSm, "font-semibold text-on-surface")}>
          الوقائع ({result.findings.length})
        </span>
        {result.findings.length === 0 ? (
          <Card className="p-space-md">
            <p className={cx(t.bodySm, "text-on-surface-variant")}>لم تُرصد أي واقعة.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-space-xs">
            {result.findings.map((f, index) => (
              <li key={`${f.layer}-${f.start}-${index}`}>
                <FindingRow finding={f} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {result.coverage.length > 0 && (
        <Card className="flex flex-col gap-space-xs border-surface-container-high p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>ما لم يُفحص</span>
          <ul className="flex flex-col gap-space-xs">
            {result.coverage.map((note, i) => (
              <li key={i} className="flex items-start gap-space-xs">
                <Badge tone="outline">{note.layer}</Badge>
                <span className={cx(t.bodySm, "text-on-surface-variant")}>{note.reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const tone = CLASS_TONE[finding.cls];
  return (
    <Card className="flex flex-col gap-space-xs p-space-sm">
      <div className="flex flex-wrap items-center gap-space-xs">
        <Badge tone={tone.tone}>{tone.label}</Badge>
        <Badge tone="outline">{KIND_LABEL[finding.kind] ?? finding.kind}</Badge>
        <span className={cx(t.code, "text-outline")}>{finding.layer}</span>
        {finding.end > finding.start && (
          <span className={cx(t.code, "text-outline")}>
            {finding.start}–{finding.end}
          </span>
        )}
      </div>

      {finding.end > finding.start && (
        <p dir="auto" className={cx(t.body, "rounded bg-surface-container-low p-2 text-on-surface")}>
          «{finding.span}»
        </p>
      )}

      <div className="grid gap-space-xs sm:grid-cols-2">
        <div>
          <span className={cx(t.code, "text-outline")}>من الأصل</span>
          <p dir="rtl" className={cx(t.bodySm, "text-on-surface")}>
            {finding.evidence.source || "—"}
          </p>
        </div>
        <div>
          <span className={cx(t.code, "text-outline")}>من المشتق</span>
          <p dir="ltr" className={cx(t.bodySm, "text-on-surface")}>
            {finding.evidence.derived || "—"}
          </p>
        </div>
      </div>

      <p className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>{finding.evidence.note}</p>
    </Card>
  );
}

function HighlightedText({ text, findings }: { text: string; findings: readonly Finding[] }) {
  const parts = useMemo(() => {
    const located = findings
      .filter((f) => f.end > f.start)
      .sort((a, b) => a.start - b.start);

    const out: ReactNode[] = [];
    let cursor = 0;
    for (const f of located) {
      if (f.start < cursor) continue;
      out.push(text.slice(cursor, f.start));
      out.push(
        <mark
          key={`${f.start}-${f.end}`}
          className={cx(
            "rounded px-0.5",
            f.cls === "shifted" ? "bg-error-container text-on-error-container" : "bg-primary/15 text-on-surface",
          )}
        >
          {text.slice(f.start, f.end)}
        </mark>,
      );
      cursor = f.end;
    }
    out.push(text.slice(cursor));
    return out;
  }, [findings, text]);

  return (
    <p dir="auto" className={cx(t.body, "leading-relaxed text-on-surface")}>
      {parts}
    </p>
  );
}

function VerdictStep() {
  const audit = useAudit();
  const result = audit.result;

  if (!result) {
    return (
      <div className="flex flex-col gap-space-lg">
        <SectionTitle title="الحكم" hint="لم يُنفَّذ فحص بعد." />
        <Card className="p-space-lg">
          <p className={cx(t.body, "text-on-surface-variant")}>نفّذ الفحص أولًا ليصدر الحكم.</p>
        </Card>
      </div>
    );
  }

  const meta = {
    faithful: { tone: "bg-primary/10 text-primary", icon: "verified", label: "مطابق" },
    needs_revision: { tone: "bg-error-container text-on-error-container", icon: "report", label: "يحتاج تعديل" },
    refer: { tone: "bg-tertiary-container/20 text-tertiary", icon: "front_hand", label: "وقف وتحويل" },
  }[result.verdict];

  const shifted = result.findings.filter((f) => f.cls !== "preserved");

  return (
    <div className="flex flex-col gap-space-lg">
      <SectionTitle title="الحكم" hint="حكم واحد، بثلاث حالات، ومعه ثلاثة مرفقات إلزامية: السبب والموضع والدليل." />

      <Card className="flex flex-col gap-space-sm p-space-lg">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className={cx("inline-flex items-center gap-1 rounded-lg px-space-md py-1.5 text-sm font-bold", meta.tone)}>
            <Icon name={meta.icon} className="text-base" />
            {meta.label}
          </span>
          {audit.runPath && (
            <Badge tone="outline">{audit.runPath === "server" ? "نُفّذ على الخادم" : "نُفّذ في المتصفح"}</Badge>
          )}
        </div>
        <p className={cx(t.body, "leading-relaxed text-on-surface")}>{result.reason}</p>
        {result.verdict === "refer" && (
          <p className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>
            الوقف هنا نتيجة معتبرة لا فشل: نظام يعرف أن يقول «ما أقدر أحكم» أصدق من نظام يخمّ ويُخرج كلامًا
            مقنعًا وهو غلط.
          </p>
        )}
      </Card>

      <div className="grid gap-space-sm lg:grid-cols-3">
        <Card className="p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>السبب</span>
          <p className={cx(t.bodySm, "text-on-surface-variant")}>
            {shifted.length > 0 ? `${shifted.length} واقعة تحتاج نظرًا` : "لا شيء يستدعي التعديل في حدود الفحص"}
          </p>
        </Card>
        <Card className="p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>الموضع</span>
          <p className={cx(t.bodySm, "text-on-surface-variant")}>
            {shifted.filter((f) => f.end > f.start).length} موضعًا محددًا في النص المشتق
          </p>
        </Card>
        <Card className="p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>الدليل</span>
          <p className={cx(t.bodySm, "text-on-surface-variant")}>
            لكل واقعة نصها من الأصل ونصها من المشتق
          </p>
        </Card>
      </div>

      {shifted.length > 0 && (
        <ul className="flex flex-col gap-space-xs">
          {shifted.map((f, index) => (
            <li key={index}>
              <FindingRow finding={f} />
            </li>
          ))}
        </ul>
      )}

      <Card className="flex flex-col gap-space-xs p-space-md">
        <span className={cx(t.labelSm, "font-semibold text-on-surface")}>قرار المراجع البشري</span>
        <textarea
          dir="rtl"
          rows={3}
          value={audit.reviewerDecision}
          onChange={(e) => audit.setReviewerDecision(e.target.value)}
          placeholder="اكتب قرارك هنا. القرار جزء من السجل، ويعاد ترميز البصمة عليه."
          className="w-full resize-y rounded-lg border border-surface-container-high bg-surface-container-lowest p-space-sm font-body-md text-body-md text-on-surface outline-none focus:border-primary"
        />
        <p className={cx(t.bodySm, "text-on-surface-variant")}>
          النظام لا يُلغي المراجع: يوجّه نظره إلى الموضع الذي يستحق وقته، ويبقى القرار له.
        </p>
      </Card>
    </div>
  );
}

function RecordStep() {
  const audit = useAudit();
  const record = audit.record;

  if (!record) {
    return (
      <div className="flex flex-col gap-space-lg">
        <SectionTitle title="السجل والتحقق" hint="لم يصدر سجل بعد." />
        <Card className="p-space-lg">
          <p className={cx(t.body, "text-on-surface-variant")}>نفّذ الفحص أولًا ليصدر السجل.</p>
        </Card>
      </div>
    );
  }

  const checkedTotal = Object.values(record.layerSummary).reduce((acc, s) => acc + s.checked, 0);

  return (
    <div className="flex flex-col gap-space-lg">
      <SectionTitle
        title="السجل والتحقق"
        hint="السجل يحمل كل ما يلزم لإعادة الوصول إلى الحكم نفسه دون سؤال النظام."
      />

      <div className="grid gap-space-sm lg:grid-cols-2">
        <Card className="flex flex-col gap-space-xs p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>بصمة السجل (SHA-256)</span>
          <code dir="ltr" className={cx(t.code, "break-all rounded bg-surface-container p-2 text-on-surface")}>
            {record.digest}
          </code>
          <span className={cx(t.bodySm, "text-on-surface-variant")}>
            تغيير أي حرف في السجل يكسر البصمة.
          </span>
        </Card>

        <Card className="flex flex-col gap-space-xs p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>محتوى السجل</span>
          <ul className={cx(t.bodySm, "flex flex-col gap-1 text-on-surface-variant")}>
            <li>إصدار المحرك: {record.engineVersion}</li>
            <li>إصدار بنك القيود: {record.bank.version}</li>
            <li>النموذج: {record.model.id ?? "لم يُستعمل نموذج في هذا التشغيل"}</li>
            <li>وقائع مسجلة: {record.findings.length} من {checkedTotal} فحصًا</li>
            <li>قرار المراجع: {record.reviewerDecision ?? "لم يُسجَّل بعد"}</li>
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-space-sm">
        <button
          type="button"
          onClick={audit.verify}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-space-md py-space-xs text-sm font-semibold text-on-primary"
        >
          <Icon name="fact_check" className="text-base" />
          تحقق من السجل
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(JSON.stringify(record, null, 2));
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-surface-container-high px-space-md py-space-xs text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="content_copy" className="text-base" />
          انسخ السجل
        </button>
      </div>

      {audit.verification && (
        <Card
          className={cx(
            "flex flex-col gap-space-xs p-space-md",
            audit.verification.ok ? "border-primary/40" : "border-error-container",
          )}
        >
          <div className="flex items-center gap-space-xs">
            <Badge tone={audit.verification.ok ? "primary" : "error"}>
              {audit.verification.ok ? "السجل سليم" : "السجل غير سليم"}
            </Badge>
          </div>
          <ul className="flex flex-col gap-space-xs">
            {audit.verification.notes.map((note, i) => (
              <li key={i} className={cx(t.bodySm, "text-on-surface-variant")}>
                {note}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {audit.rejected.length > 0 && (
        <Card className="flex flex-col gap-space-xs p-space-md">
          <span className={cx(t.labelSm, "font-semibold text-on-surface")}>بنود رُفضت من مخرج النموذج</span>
          <ul className="flex flex-col gap-space-xs">
            {audit.rejected.map((reason, i) => (
              <li key={i} className={cx(t.bodySm, "text-on-surface-variant")}>
                {reason}
              </li>
            ))}
          </ul>
          <p className={cx(t.bodySm, "text-on-surface-variant")}>
            الاقتباس الذي لا يوجد في النص حرفيًا يُرفض، فلا يستطيع النموذج أن يخترع موضعًا.
          </p>
        </Card>
      )}

      <Card className="p-space-md">
        <details>
          <summary className={cx(t.labelSm, "cursor-pointer font-semibold text-on-surface")}>
            السجل الكامل (JSON)
          </summary>
          <pre
            dir="ltr"
            className={cx(t.code, "mt-space-sm max-h-96 overflow-auto rounded bg-surface-container p-2 text-on-surface")}
          >
            {JSON.stringify(record, null, 2)}
          </pre>
        </details>
      </Card>
    </div>
  );
}
