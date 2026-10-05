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
      <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between gap-space-sm border-b border-outline-variant bg-surface/95 px-gutter backdrop-blur-xl md:px-margin-desktop">
        <div className="flex min-w-0 items-center gap-space-md">
          <div className="flex min-w-0 items-center gap-space-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Icon name="balance" className="text-lg" />
            </span>
            <span className={cx(t.h4, "truncate tracking-tight text-primary")}>مَوْزُون | MAWZŪN</span>
            <span className={cx(t.code, "hidden font-normal text-on-surface-variant sm:inline")}>
              {s("topbar.sub")}
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-space-xs md:flex">
            {nav.map((stage) => (
              <a
                key={stage.id}
                href={`#${stage.id}`}
                className={cx(
                  t.label,
                  "rounded px-space-md py-2.5 transition-colors",
                  nav.length === 1
                    ? "bg-primary-container text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                {s(`stage.${stage.id}`)}
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
              "flex h-10 cursor-pointer items-center gap-space-xs rounded border border-outline-variant px-space-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high",
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
              "flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-high",
            )}
          >
            <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-lg" />
          </button>

          <button
            type="button"
            aria-label={s("topbar.settings")}
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className={cx(
              "flex h-10 w-10 cursor-pointer items-center justify-center rounded border transition-colors",
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
