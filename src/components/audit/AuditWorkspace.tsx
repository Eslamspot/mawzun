"use client";

/**
 * The audit workspace.
 *
 * One scrolling page with a numbered section per stage, matching the design:
 * a session bar carrying the stepper, the five workflow cards in order, and the
 * footer. Navigation is anchor-based, so a stage is a section rather than a
 * route and the stepper can never point at something that does not exist.
 */

import { useEffect, useState } from "react";
import { STAGES } from "@/lib/stages";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { Stepper } from "@/components/audit/parts";
import { InputSection } from "@/components/audit/InputSection";
import { ConstraintsSection } from "@/components/audit/ConstraintsSection";
import { PipelineSection } from "@/components/audit/PipelineSection";
import { VerdictSection } from "@/components/audit/VerdictSection";
import { LedgerSection } from "@/components/audit/LedgerSection";

export function AuditWorkspace() {
  const [activeId, setActiveId] = useState(STAGES[0].id);

  // Highlight the step whose section occupies the reading position. Done with
  // an observer rather than a scroll listener so it costs nothing while idle.
  useEffect(() => {
    const sections = STAGES.map((stage) => document.getElementById(stage.id)).filter(
      (element): element is HTMLElement => element !== null,
    );
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
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full bg-surface-container-low px-margin-desktop py-space-md shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-space-md md:flex-row md:items-center">
          <div className="flex items-center gap-space-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-container" />
            <span className={cx(t.h4, "text-primary")}>مَوْزُون | MAWZŪN</span>
            <span className={cx(t.code, "text-on-surface-variant")}>— مقياس أمانة النقل</span>
          </div>
          <Stepper activeId={activeId} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-xl px-margin-desktop py-space-xl">
        <InputSection />
        <ConstraintsSection />
        <PipelineSection />
        <VerdictSection />
        <LedgerSection />
      </div>

      <footer className="w-full bg-surface-container-low py-space-md">
        <div
          className={cx(
            t.code,
            "w-full flex flex-col items-center justify-between gap-space-sm px-margin-desktop text-on-surface-variant md:flex-row",
          )}
        >
          <div className="flex items-center gap-space-md">
            <span>مَوْزُون: يقيس أمانة النقل، ولا يفتي ولا يرجّح مذهبًا</span>
            <span>SHA-256 RECORD</span>
          </div>
          <div className="flex items-center gap-space-lg">
            <span>المراجع البشري صاحب القرار</span>
            <span>© 2026 MAWZŪN RESEARCH WORKSPACE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
