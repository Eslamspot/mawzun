"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { stageFromPath } from "@/lib/stages";
import { t } from "@/lib/typography";
import { SearchModal } from "@/components/layout/SearchModal";
import { NotificationsModal } from "@/components/layout/NotificationsModal";
import { SettingsModal } from "@/components/layout/SettingsModal";

function Crumb({ children }: { children: React.ReactNode }) {
  return <span className="hover:text-on-surface transition-colors">{children}</span>;
}

export function TopBar() {
  const pathname = usePathname();
  const current = stageFromPath(pathname);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global keyboard shortcut for Search: Cmd+K or Ctrl+K
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

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface-container-lowest/90 px-gutter shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed/40 text-primary">
              <Icon name="verified_user" className="text-xl" filled />
            </span>
            <div className="flex flex-col pr-space-xs">
              <span className="flex items-center gap-space-xs">
                <span className={cx(t.h3, "font-bold tracking-tight text-primary")}>
                  موزون
                </span>
                <span
                  className={`${t.code} rounded bg-surface-container px-space-xs py-0.5 text-[10px] text-secondary`}
                >
                  ١.٠
                </span>
              </span>
              <span className={`${t.labelSm} font-normal text-on-surface-variant`}>
                مقياس أمانة النقل
              </span>
            </div>
          </div>

          <div className="hidden h-4 w-px bg-surface-container-high md:block" />

          <div
            className={`hidden items-center gap-space-xs ${t.label} text-on-surface-variant md:flex`}
          >
            <Crumb>موزون</Crumb>
            <Icon name="chevron_left" className="text-sm text-outline" />
            <Crumb>مساحة العمل</Crumb>
            <Icon name="chevron_left" className="text-sm text-outline" />
            <span className="font-semibold text-primary">
              {current.ordinal} {current.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="البحث في القواعد والضوابط"
            className={cx(
              "hidden items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-1.5 text-on-surface-variant sm:flex transition-colors hover:bg-surface-container",
              t.bodySm,
            )}
          >
            <Icon name="search" className="text-base text-outline" />
            <span className="text-outline">بحث في القواعد والضوابط...</span>
            <kbd
              className={`${t.code} rounded bg-surface-container-lowest px-1 text-[10px] text-outline shadow-xs`}
            >
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            aria-label="الإشعارات"
            onClick={() => {
              setIsNotifOpen((prev) => !prev);
              setIsSettingsOpen(false);
            }}
            className={cx(
              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isNotifOpen
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Icon name="notifications" className="text-lg" />
            <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-tertiary-container ring-2 ring-surface-container-lowest" />
          </button>

          <button
            type="button"
            aria-label="الإعدادات"
            onClick={() => {
              setIsSettingsOpen((prev) => !prev);
              setIsNotifOpen(false);
            }}
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isSettingsOpen
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Icon name="tune" className="text-lg" />
          </button>
        </div>
      </header>

      {/* Interactive Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}