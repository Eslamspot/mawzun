"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { STAGES, unlockedStageIds } from "@/lib/stages";
import { useAudit } from "@/context/AuditContext";
import { useLang } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { t } from "@/lib/typography";
import { SearchModal } from "@/components/layout/SearchModal";
import { SettingsModal } from "@/components/layout/SettingsModal";

/**
 * Global header.
 *
 * Follows the design's header composition: brand block, section navigation, and
 * the tool actions on the trailing edge. The earlier notification bell is gone —
 * it shipped a permanently-lit red dot that announced nothing, and the design
 * this header is ported from has no such control.
 */
export function TopBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global keyboard shortcut for search: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const audit = useAudit();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, s } = useLang();
  // Only the sections that exist are offered: before a run that is step one
  // alone, because the rest of the workflow describes an output there isn't one.
  const unlocked = unlockedStageIds(audit.result !== null);
  const nav = STAGES.filter((stage) => unlocked.includes(stage.id));

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-desktop backdrop-blur-xl">
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Icon name="balance" className="text-lg" />
            </span>
            <span className={cx(t.h4, "tracking-tight text-primary")}>مَوْزُون | MAWZŪN</span>
            <span className={cx(t.code, "font-normal text-on-surface-variant")}>{s("topbar.sub")}</span>
          </div>
          <span className="flex items-center gap-space-xs rounded-full border border-gold/50 bg-gold-container px-space-sm py-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-gold" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            <span className={cx(t.code, "text-on-gold-container")}>ONLINE / v1.0</span>
          </span>
        </div>

        <nav className="hidden items-center gap-space-xs md:flex">
          {nav.map((stage, index) => (
            <a
              key={stage.id}
              href={`#${stage.id}`}
              className={cx(
                t.label,
                "rounded px-space-md py-1.5 transition-colors",
                index === 0 && nav.length === 1
                  ? "bg-primary-container text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
              )}
            >
              {stage.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            aria-label={s("topbar.search.aria")}
            onClick={() => setIsSearchOpen(true)}
            className={cx(
              t.bodySm,
              "hidden items-center gap-space-xs rounded border border-outline-variant bg-surface-container-low px-space-sm py-1.5 text-on-surface-variant transition-colors hover:bg-surface-container sm:flex",
            )}
          >
            <Icon name="search" className="text-base text-outline" />
            <span className="text-outline">{s("topbar.search.ph")}</span>
            <kbd className={cx(t.code, "rounded bg-surface-container-lowest px-1 text-outline")}>
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            aria-label={lang === "ar" ? "Switch to English" : "التحويل إلى العربية"}
            onClick={toggleLang}
            className={cx(
              t.labelSm,
              "flex h-9 cursor-pointer items-center gap-space-xs rounded border border-outline-variant px-space-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high",
            )}
          >
            <Icon name="language" className="text-lg" />
            {lang === "ar" ? "EN" : "عربي"}
          </button>

          <button
            type="button"
            aria-label={theme === "dark" ? s("topbar.theme.toLight") : s("topbar.theme.toDark")}
            onClick={toggle}
            className={cx(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high",
            )}
          >
            <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-lg" />
          </button>

          <button
            type="button"
            aria-label={s("topbar.settings")}
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className={cx(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded border transition-colors",
              isSettingsOpen
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Icon name="tune" className="text-lg" />
          </button>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
