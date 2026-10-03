/**
 * Stages of the Mawzun audit workflow, in order.
 *
 * This is the single source of truth shared by the `TopBar` breadcrumb and the
 * workspace's own step rail, so navigation can never drift out of sync with the
 * routes.
 */
export type StageStatus = "done" | "active" | "pending";

export type Stage = {
  /** Route segment, e.g. `/01-input`. */
  readonly slug: string;
  /** Two-digit ordinal shown in the sidebar, e.g. `01`. */
  readonly ordinal: string;
  /** Short Arabic label used in the sidebar and breadcrumb. */
  readonly title: string;
  /** Material Symbols icon name. */
  readonly icon: string;
  /** Filled variant of the icon, used once a stage is complete. */
  readonly doneIcon: string;
};

export const STAGES: readonly Stage[] = [
  {
    slug: "01-input",
    ordinal: "01",
    title: "المدخلات الأربعة",
    icon: "edit_note",
    doneIcon: "check_circle",
  },
  {
    slug: "02-constraints",
    ordinal: "02",
    title: "بنك القيود",
    icon: "rule_folder",
    doneIcon: "check_circle",
  },
  {
    slug: "03-check",
    ordinal: "03",
    title: "الفحص بثلاث طبقات",
    icon: "fact_check",
    doneIcon: "check_circle",
  },
  {
    slug: "04-verdict",
    ordinal: "04",
    title: "الحكم",
    icon: "gavel",
    doneIcon: "check_circle",
  },
  {
    slug: "05-record",
    ordinal: "05",
    title: "السجل والتحقق",
    icon: "verified",
    doneIcon: "verified",
  },
] as const;

export const FIRST_STAGE = STAGES[0];
export const LAST_STAGE = STAGES[STAGES.length - 1];

export function stageHref(slug: string): string {
  return `/${slug}`;
}

/** Resolve the current stage from a pathname, falling back to the first stage. */
export function stageFromPath(pathname: string): Stage {
  const segment = pathname.split("/").filter(Boolean)[0];
  return STAGES.find((stage) => stage.slug === segment) ?? FIRST_STAGE;
}

/** Status of `stage` relative to the stage the user is currently viewing. */
export function stageStatus(stage: Stage, current: Stage): StageStatus {
  if (stage.slug === current.slug) return "active";
  const stageIndex = STAGES.findIndex((s) => s.slug === stage.slug);
  const currentIndex = STAGES.findIndex((s) => s.slug === current.slug);
  return stageIndex < currentIndex ? "done" : "pending";
}

/** Previous stage, or `null` when already on the first one. */
export function previousStage(current: Stage): Stage | null {
  const index = STAGES.findIndex((s) => s.slug === current.slug);
  return index > 0 ? STAGES[index - 1] : null;
}

/** Next stage, or `null` when already on the last one. */
export function nextStage(current: Stage): Stage | null {
  const index = STAGES.findIndex((s) => s.slug === current.slug);
  return index >= 0 && index < STAGES.length - 1 ? STAGES[index + 1] : null;
}