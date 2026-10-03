/**
 * Shared context passed to each check layer.
 *
 * Kept in its own module so the three layers and the semantic provider can
 * import it without importing each other.
 */

import type { ConstraintBank, ContentLevel, CoverageNote, Finding } from "./types";

export interface LayerContext {
  readonly source: string;
  readonly derived: string;
  readonly language: string;
  readonly level: ContentLevel;
  readonly bank: ConstraintBank;
}

export interface LayerOutput {
  readonly findings: readonly Finding[];
  readonly coverage: readonly CoverageNote[];
  /** How many checks this layer actually attempted. */
  readonly checked: number;
}
