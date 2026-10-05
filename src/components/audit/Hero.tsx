"use client";

/**
 * Hero — the Saudi showpiece above the workspace.
 *
 * Deliberately quiet: headline plus one line. No calls-to-action, no pillars,
 * no statistics — the workflow itself (`#step-1`) is the next thing the eye
 * meets. No workflow state, no API shape, no ids are changed here.
 */

import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { useLang } from "@/context/LanguageContext";

/** Islamic eight-point star lattice, drawn once and drifted by CSS. */
function StarLattice({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="480"
      height="480"
      viewBox="0 0 480 480"
      fill="none"
    >
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <g key={`${row}-${col}`} transform={`translate(${col * 80 + 40}, ${row * 80 + 40})`}>
            <rect
              x="-22"
              y="-22"
              width="44"
              height="44"
              stroke="currentColor"
              strokeWidth="1"
            />
            <rect
              x="-22"
              y="-22"
              width="44"
              height="44"
              stroke="currentColor"
              strokeWidth="1"
              transform="rotate(45)"
            />
            <circle r="3" fill="currentColor" />
          </g>
        )),
      )}
    </svg>
  );
}

export function Hero() {
  const { s } = useLang();

  return (
    <section
      aria-label="موزون"
      className="relative overflow-hidden bg-gradient-to-b from-[#0e5f31] via-primary-container to-[#074a24] text-on-night"
    >
      {/* Drifting geometric lattice + gold radial glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <StarLattice className="animate-drift absolute -top-40 -left-40 h-[480px] w-[480px] text-on-night opacity-[0.16]" />
        <StarLattice className="animate-drift absolute -bottom-48 -right-32 h-[480px] w-[480px] text-on-night opacity-[0.12]" />
        <div className="absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-gold/25 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-gold/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-space-lg px-gutter py-space-xl md:gap-space-xl md:px-margin-desktop md:py-16">
        <div className="flex flex-col items-start gap-space-md">
          <h1 className={cx(t.hero, "max-w-3xl text-on-night")}>
            {s("hero.title.1")} <span className="text-gold">{s("hero.title.2")}</span>
          </h1>

          <p className="max-w-2xl text-base leading-loose text-on-night/70 md:text-lg">
            {s("hero.sub")}
          </p>
        </div>
      </div>

      {/* Gold hairline where night meets the light workspace */}
      <div aria-hidden="true" className="relative h-[3px] bg-gradient-to-l from-transparent via-gold to-transparent" />
    </section>
  );
}
