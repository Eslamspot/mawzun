"use client";

/**
 * Hero — the dark Saudi showpiece above the workspace.
 *
 * Purely presentational: both calls-to-action are anchor scrolls into the
 * existing workflow (`#step-1`), and the statistics are liberated constants
 * (constraint count, layer count, golden cases) with a count-up flourish.
 * No workflow state, no API shape, no ids are changed by this component.
 */

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { Icon } from "@/components/ui/Icon";
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

const STATS: { value: number; suffix: string; labelKey: string }[] = [
  { value: 19, suffix: "", labelKey: "hero.s.constraints" },
  { value: 3, suffix: "", labelKey: "hero.s.layers" },
  { value: 15, suffix: "", labelKey: "hero.s.cases" },
  { value: 256, suffix: "-SHA", labelKey: "hero.s.record" },
];

const PILLARS: { icon: string; titleKey: string; textKey: string }[] = [
  { icon: "fingerprint", titleKey: "hero.p1.t", textKey: "hero.p1.x" },
  { icon: "dictionary", titleKey: "hero.p2.t", textKey: "hero.p2.x" },
  { icon: "psychology", titleKey: "hero.p3.t", textKey: "hero.p3.x" },
];

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Reduced-motion users get the final number on first paint — no effect needed.
  const [shown, setShown] = useState<number>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? value
      : 0,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 1100;
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="font-mono-telemetry">
      {shown}
      {suffix}
    </span>
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

          <div className="flex flex-wrap items-center gap-space-sm">
            <a
              href="#step-1"
              className="inline-flex cursor-pointer items-center gap-space-xs rounded-lg bg-gold px-6 py-3 text-sm font-bold text-on-gold shadow-[0_8px_30px_-6px_rgb(201_162_39/0.55)] transition-all duration-200 hover:brightness-110"
            >
              <Icon name="play_arrow" className="text-lg" />
              {s("hero.cta.start")}
            </a>
            <a
              href="#step-1"
              className="inline-flex cursor-pointer items-center gap-space-xs rounded-lg border border-on-night/25 px-6 py-3 text-sm font-semibold text-on-night transition-colors duration-200 hover:bg-on-night/10"
            >
              <Icon name="experiment" className="text-lg" />
              {s("hero.cta.how")}
            </a>
          </div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 gap-space-sm md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <div
              key={pillar.titleKey}
              className="group flex cursor-default items-start gap-space-md rounded-xl border border-on-night/12 bg-on-night/[0.04] p-space-md backdrop-blur-sm transition-colors duration-200 hover:border-gold/40 hover:bg-on-night/[0.07]"
            >
              <span className="animate-float-y flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold" style={{ animationDelay: `${index * 900}ms` }}>
                <Icon name={pillar.icon} className="text-xl" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-bold text-on-night">{s(pillar.titleKey)}</span>
                <span className="text-xs leading-relaxed text-on-night/60">{s(pillar.textKey)}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Live statistics */}
        <dl className="grid grid-cols-2 gap-space-sm border-t border-on-night/12 pt-space-md md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.labelKey} className="flex flex-col gap-1">
              <dd className="text-3xl font-bold text-gold">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="text-sm font-semibold text-on-night">{s(stat.labelKey)}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Gold hairline where night meets the light workspace */}
      <div aria-hidden="true" className="relative h-[3px] bg-gradient-to-l from-transparent via-gold to-transparent" />
    </section>
  );
}
