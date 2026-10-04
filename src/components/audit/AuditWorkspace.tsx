"use client";

/**
 * The audit workspace.
 *
 * One scrolling page with a numbered section per stage, matching the design:
 * a session bar carrying the stepper, the five workflow cards in order, and the
 * footer. Navigation is anchor-based, so a stage is a section rather than a
 * route and the stepper can never point at something that does not exist.
 */

import { useEffect, useRef, useState } from "react";
import { STAGES, unlockedStageIds } from "@/lib/stages";
import { useAudit } from "@/context/AuditContext";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { Icon } from "@/components/ui/Icon";
import { Stepper } from "@/components/audit/parts";
import { useLang } from "@/context/LanguageContext";
import { InputSection } from "@/components/audit/InputSection";
import { ConstraintsSection } from "@/components/audit/ConstraintsSection";
import { Hero } from "@/components/audit/Hero";
import { PipelineSection } from "@/components/audit/PipelineSection";
import { VerdictSection } from "@/components/audit/VerdictSection";
import { LedgerSection } from "@/components/audit/LedgerSection";

export function AuditWorkspace() {
  const audit = useAudit();
  const { s } = useLang();
  const [activeId, setActiveId] = useState(STAGES[0].id);

  /**
   * Steps two to five describe the output of a run, so they stay out of the page
   * until there is an output. An empty «الطبقة 01» panel is not a neutral thing
   * to show a reviewer — it reads as a finding of nothing.
   */
  const revealed = audit.result !== null;
  const unlockedIds = unlockedStageIds(revealed);

  // Highlight the step whose section occupies the reading position. Re-run when
  // the later sections are mounted, or there would be nothing to observe.
  useEffect(() => {
    const sections = unlockedIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.5, 1] },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [unlockedIds]);

  // When a run completes, the newly opened sections are below the fold. Move the
  // reader to the first of them rather than leaving the result off-screen.
  const wasRevealed = useRef(false);
  useEffect(() => {
    if (revealed && !wasRevealed.current) {
      wasRevealed.current = true;
      document.getElementById("step-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (!revealed) wasRevealed.current = false;
  }, [revealed]);

  return (
    <div className="min-h-screen bg-surface">
      <Hero />

      <div className="w-full border-b-2 border-gold/60 bg-surface-container-low px-gutter py-space-sm shadow-sm md:px-margin-desktop">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-space-sm md:flex-row md:items-center">
          <Stepper activeId={activeId} unlockedIds={unlockedIds} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-xl px-gutter py-space-xl md:px-margin-desktop">
        <InputSection />

        {revealed && (
          <>
            <div className="reveal reveal-1">
              <ConstraintsSection />
            </div>
            <div className="reveal reveal-2">
              <PipelineSection />
            </div>
            <div className="reveal reveal-3">
              <VerdictSection />
            </div>
            <div className="reveal reveal-4">
              <LedgerSection />
            </div>
          </>
        )}
      </div>

      <footer className="w-full bg-night py-space-md text-on-night">
        <div
          className={cx(
            t.code,
            "w-full flex flex-col items-center justify-between gap-space-sm px-gutter text-on-night/70 md:flex-row md:px-margin-desktop",
          )}
        >
          <div className="flex items-center gap-space-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/15 text-gold">
              <Icon name="balance" className="text-sm" />
            </span>
            <span>{s("foot.a")}</span>
            <span className="text-gold">SHA-256 RECORD</span>
          </div>
          <div className="flex items-center gap-space-lg">
            <span>{s("foot.b")}</span>
            <span>{s("foot.c")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
