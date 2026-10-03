"use client";

/**
 * Step 1 — الإدخال والتوصيف.
 *
 * The four inputs of the specification: the source text, the derived text, the
 * work type and the content level. The fingerprints under each textarea are real
 * SHA-256 prefixes, not decoration — the record carries the full digests, so a
 * reader can confirm the text they are looking at is the text that was audited.
 */

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAudit } from "@/context/AuditContext";
import { sha256Hex } from "@/lib/audit";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import type { ContentLevel, WorkType } from "@/lib/audit/types";
import { CodeChip, StatusChip, WorkflowCard } from "./parts";

const WORK_TYPES: { id: WorkType; label: string; latin: string }[] = [
  { id: "translate", label: "ترجمة", latin: "Translation" },
  { id: "summarize", label: "تلخيص", latin: "Summary" },
  { id: "paraphrase", label: "إعادة صياغة", latin: "Paraphrase" },
];

const LEVELS: { id: ContentLevel; label: string; latin: string; hint: string }[] = [
  { id: "A", label: "المستوى أ", latin: "أصل مستقر", hint: "قرآن وحديث صحيح وأركان — فحص صارم موثق بالمصدر." },
  { id: "B", label: "المستوى ب", latin: "شرح وتعريف", hint: "شرح المفاهيم والاستدلال من المادة المعتمدة مع إظهار المرجع." },
  { id: "C", label: "المستوى ج", latin: "خلافي وحساس", hint: "مسائل خلافية أو عالية الحساسية — إجابة مقيدة أو بيان الخلاف أو الإحالة للمختص." },
  { id: "D", label: "المستوى د", latin: "حالة شخصية", hint: "فتوى أو حالة خاصة — وقف وتحويل دائم، لا حكم مستقل من النظام." },
];

const TARGET_LANGUAGES: { id: string; label: string }[] = [
  { id: "en", label: "الإنجليزية (English)" },
  { id: "fr", label: "الفرنسية (Français)" },
  { id: "ur", label: "الأردية (اردو)" },
  { id: "id", label: "الإندونيسية (Bahasa Indonesia)" },
  { id: "tr", label: "التركية (Türkçe)" },
  { id: "fa", label: "الفارسية (فارسی)" },
  { id: "es", label: "الإسبانية (Español)" },
  { id: "de", label: "الألمانية (Deutsch)" },
  { id: "ms", label: "الملايو (Bahasa Melayu)" },
  { id: "bn", label: "البنغالية (বাংলা)" },
];

/**
 * Teaching examples drawn from the golden cases in `data/knowledge/`. Each
 * one demonstrates a different lesson: softening a ruling, a correct
 * rendering for contrast, hardening a ruling, distorting a term, a number
 * the deterministic layer catches, and a personal case that must stop.
 */
export const EXAMPLES: {
  tag: string;
  sourceText: string;
  derivedText: string;
  workType: WorkType;
  contentLevel: ContentLevel;
  targetLanguage: string;
}[] = [
  {
    tag: "تخفيف الحكم: «لا يجوز» نُقلت إلى not recommended",
    sourceText: "لا يجوز تأجير العقار من الباطن إلا بإذن صريح.",
    derivedText: "Subleasing the property is not recommended without explicit permission.",
    workType: "translate",
    contentLevel: "B",
    targetLanguage: "en",
  },
  {
    tag: "ترجمة سليمة للمقارنة: prohibited تحفظ قوة المنع",
    sourceText: "لا يجوز تأجير العقار من الباطن إلا بإذن صريح.",
    derivedText: "Subleasing the property is prohibited without explicit permission.",
    workType: "translate",
    contentLevel: "B",
    targetLanguage: "en",
  },
  {
    tag: "تشديد الحكم: مستحب رُفع إلى obligatory",
    sourceText: "يُستحب الوضوء قبل النوم.",
    derivedText: "Wudu before sleeping is obligatory.",
    workType: "translate",
    contentLevel: "B",
    targetLanguage: "en",
  },
  {
    tag: "تحريف المصطلح: التوحيد أصبح numerical oneness",
    sourceText: "التوحيد أصل الدين.",
    derivedText: "Numerical oneness is the foundation of the religion.",
    workType: "translate",
    contentLevel: "B",
    targetLanguage: "en",
  },
  {
    tag: "خطأ عددي تكشفه الطبقة الحتمية: ثلاث → two",
    sourceText: "صام ثلاث ليال متتالية.",
    derivedText: "He fasted for two consecutive nights.",
    workType: "translate",
    contentLevel: "A",
    targetLanguage: "en",
  },
  {
    tag: "المستوى د: حالة شخصية تنتهي بوقف وتحويل",
    sourceText: "أنا في دولة كذا، هل يجوز لي فعل كذا في زواجي؟",
    derivedText: "Subleasing is not recommended in your case.",
    workType: "translate",
    contentLevel: "D",
    targetLanguage: "en",
  },
];

/**
 * Real fingerprint of the text, shown as a short prefix. Returns null until the
 * digest resolves; the caller renders "—" for blank text, so the effect body
 * never calls setState synchronously.
 */
function useShortHash(text: string): string | null {
  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!text.trim()) return;
    void sha256Hex(text).then((value) => {
      if (!cancelled) setHash(`${value.slice(0, 6)}…${value.slice(-4)}`);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return hash;
}

function Pills<T extends string>({
  label,
  latin,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  latin: string;
  options: { id: T; label: string; latin: string }[];
  value: T;
  onChange: (next: T) => void;
  columns: string;
}) {
  return (
    <div className="flex flex-col gap-space-xs">
      <span className={cx(t.label, "font-semibold text-on-surface")}>
        {label} <span className={cx(t.bodySm, "text-on-surface-variant")}>({latin})</span>
      </span>
      <div className={cx("grid gap-space-xs", columns)}>
        {options.map((option) => (
          <label key={option.id} className="cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={label}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span
              className={cx(
                t.labelSm,
                "block rounded-xs py-2 px-space-xs text-center shadow-sm transition-colors",
                value === option.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function InputSection() {
  const audit = useAudit();
  const sourceHash = useShortHash(audit.sourceText);
  const derivedHash = useShortHash(audit.derivedText);
  const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
  const [exampleTag, setExampleTag] = useState<string | null>(null);

  const ready = audit.sourceText.trim().length > 0 && audit.derivedText.trim().length > 0;

  /** Load a random teaching example, never the one already on screen. */
  function loadRandomExample() {
    const pool = EXAMPLES.filter((example) => example.derivedText !== audit.derivedText);
    const pick = (pool.length > 0 ? pool : EXAMPLES)[Math.floor(Math.random() * (pool.length > 0 ? pool.length : EXAMPLES.length))];
    audit.setSourceText(pick.sourceText);
    audit.setDerivedText(pick.derivedText);
    audit.setContentLevel(pick.contentLevel);
    audit.setWorkType(pick.workType);
    audit.setTargetLanguage(pick.targetLanguage);
    setExampleTag(pick.tag);
  }

  return (
    <WorkflowCard
      id="step-1"
      number={1}
      title="الإدخال والتوصيف (Input & Classification)"
      subtitle="تغذية النص الأصلي المرجعي والنص المشتق الخاضع للمراجعة الدلالية"
      aside={
        <StatusChip tone={ready ? "verified" : "neutral"} icon={ready ? "check" : "pending"}>
          {ready ? "جاهز للفحص" : "بانتظار المدخلات"}
        </StatusChip>
      }
    >
      <div className="grid grid-cols-1 gap-space-md rounded-lg border border-outline-variant bg-surface-container-low p-space-md md:grid-cols-3">
        <Pills
          label="نوع العمل"
          latin="Operation Type"
          options={WORK_TYPES}
          value={audit.workType}
          onChange={audit.setWorkType}
          columns="grid-cols-3"
        />
        <Pills
          label="مستوى المحتوى"
          latin="Content Level"
          options={LEVELS}
          value={audit.contentLevel}
          onChange={audit.setContentLevel}
          columns="grid-cols-4"
        />
        <div className="flex flex-col gap-space-xs">
          <span className={cx(t.label, "font-semibold text-on-surface")}>
            اللغة الهدف <span className={cx(t.bodySm, "text-on-surface-variant")}>(Target)</span>
          </span>
          <select
            value={audit.targetLanguage}
            onChange={(event) => audit.setTargetLanguage(event.target.value)}
            className={cx(
              t.labelSm,
              "rounded-xs border border-outline-variant bg-surface-container-lowest px-space-sm py-2 text-on-surface",
            )}
          >
            {TARGET_LANGUAGES.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
          <span className={cx(t.bodySm, "text-on-surface-variant")}>
            المقابلات المعتمدة إنجليزية فقط؛ اللغات الأخرى تُفحص حتميًا ودلاليًا،
            وما لم يُفحص يُعلن في السجل.
          </span>
        </div>
      </div>

      <div className={cx(t.bodySm, "rounded-lg border border-gold/40 bg-gold-container/40 p-space-sm leading-relaxed text-on-surface")}>
        <span className="font-bold">المستوى المختار ({LEVELS.find((level) => level.id === audit.contentLevel)?.label}): </span>
        {LEVELS.find((level) => level.id === audit.contentLevel)?.hint}
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="original-text"
              className={cx(t.label, "flex items-center gap-space-xs font-semibold text-on-surface")}
            >
              <span className="h-2 w-2 rounded-full bg-secondary" />
              النص الأصلي (Original Text)
            </label>
            <CodeChip>المرجع: الحزمة العلمية المعتمدة</CodeChip>
          </div>
          <textarea
            id="original-text"
            dir="rtl"
            rows={7}
            value={audit.sourceText}
            onChange={(event) => audit.setSourceText(event.target.value)}
            placeholder="الصق النص الشرعي الأصلي هنا."
            className={cx(
              t.body,
              "w-full resize-y rounded-lg bg-surface-container-low p-space-md leading-relaxed text-on-surface transition-all focus:bg-surface-container-lowest focus:shadow-md focus:outline-none",
            )}
          />
          <div className={cx(t.code, "flex items-center justify-between px-1 text-on-surface-variant")}>
            <span>عدد الكلمات: {words(audit.sourceText)}</span>
            <span>بصمة النص: {audit.sourceText.trim() ? (sourceHash ?? "…") : "—"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="derived-text"
              className={cx(t.label, "flex items-center gap-space-xs font-semibold text-on-surface")}
            >
              <span className="h-2 w-2 rounded-full bg-secondary-container" />
              النص المشتق (Derived Text)
            </label>
            <CodeChip>مخرج خاضع للمراجعة</CodeChip>
          </div>
          <textarea
            id="derived-text"
            dir="auto"
            rows={7}
            value={audit.derivedText}
            onChange={(event) => audit.setDerivedText(event.target.value)}
            placeholder="Paste the translation / summary / paraphrase here."
            className={cx(
              t.body,
              "w-full resize-y rounded-lg bg-surface-container-low p-space-md leading-relaxed text-on-surface transition-all focus:bg-surface-container-lowest focus:shadow-md focus:outline-none",
            )}
          />
          <div className={cx(t.code, "flex items-center justify-between px-1 text-on-surface-variant")}>
            <span>عدد الكلمات: {words(audit.derivedText)}</span>
            <span>بصمة النص: {audit.derivedText.trim() ? (derivedHash ?? "…") : "—"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-space-sm">
        <button
          type="button"
          onClick={() => void audit.run()}
          disabled={audit.isRunning || !ready}
          className={cx(
            t.label,
            "relative inline-flex cursor-pointer items-center gap-space-xs overflow-hidden rounded-lg bg-primary-container px-space-lg py-3 font-bold text-on-primary-container shadow-[0_8px_24px_-8px_rgb(0_108_53/0.6)] transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
            ready && !audit.isRunning && "animate-pulse-ring",
          )}
        >
          <Icon name="play_arrow" className="text-base" />
          {audit.isRunning ? "جارٍ الفحص…" : "نفّذ الفحص ثلاثي الطبقات"}
          {audit.isRunning && (
            <span
              aria-hidden="true"
              className="animate-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-l from-transparent via-white/30 to-transparent"
            />
          )}
        </button>
        <button
          type="button"
          onClick={loadRandomExample}
          className={cx(
            t.label,
            "inline-flex cursor-pointer items-center gap-space-xs rounded-xs border border-outline-variant px-space-md py-2 font-semibold text-on-surface-variant transition-colors hover:bg-surface-container",
          )}
          title="مثال عشوائي من الحالات الذهبية يوضح درسًا مختلفًا في كل مرة"
        >
          <Icon name="experiment" className="text-base" />
          حمّل مثالًا عشوائيًا
        </button>
        <button
          type="button"
          onClick={audit.reset}
          className={cx(
            t.label,
            "inline-flex items-center gap-space-xs rounded-xs px-space-sm py-2 text-on-surface-variant transition-colors hover:bg-surface-container",
          )}
        >
          <Icon name="restart_alt" className="text-base" />
          تهيئة
        </button>
        {audit.error && (
          <StatusChip tone="escalate" icon="error">
            {audit.error}
          </StatusChip>
        )}
        {exampleTag && (
          <StatusChip tone="revision" icon="school">
            درس هذا المثال: {exampleTag}
          </StatusChip>
        )}
      </div>
    </WorkflowCard>
  );
}
