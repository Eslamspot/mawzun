/**
 * The five stages of the audit workspace.
 *
 * Single source of truth for the top-bar stepper, the in-page step rail and the
 * anchor targets, so navigation can never drift from the sections that exist.
 * The design is a single scrolling workspace with a numbered section per stage,
 * so a stage is identified by its section id rather than by a route.
 */
export type Stage = {
  /** DOM id of the section, e.g. `step-1`. */
  readonly id: string;
  /** Two-digit ordinal shown in the stepper. */
  readonly ordinal: string;
  /** Short Arabic label. */
  readonly title: string;
  /** Material Symbols icon name. */
  readonly icon: string;
  /** Filled variant, used once the stage is complete. */
  readonly doneIcon: string;
};

export const STAGES: readonly Stage[] = [
  { id: "step-1", ordinal: "01", title: "الإدخال والتوصيف", icon: "edit_note", doneIcon: "check_circle" },
  { id: "step-2", ordinal: "02", title: "القيود المعتمدة", icon: "rule_folder", doneIcon: "check_circle" },
  { id: "step-3", ordinal: "03", title: "الفحص ثلاثي الطبقات", icon: "fact_check", doneIcon: "check_circle" },
  { id: "step-4", ordinal: "04", title: "الحكم التقريري", icon: "gavel", doneIcon: "check_circle" },
  { id: "step-5", ordinal: "05", title: "الشهادة والسجل", icon: "verified", doneIcon: "verified" },
] as const;

/**
 * The stages that actually exist in the DOM for a given run state.
 *
 * Steps two to five are not rendered until an audit has run — they describe its
 * output, and showing them before there is an output invites the reader to read
 * empty panels as findings. Every navigation surface derives its links from this
 * function so none of them can point at a section that is not there.
 */
export function unlockedStageIds(hasRun: boolean): readonly string[] {
  return hasRun ? STAGES.map((stage) => stage.id) : [STAGES[0].id];
}
