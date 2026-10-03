"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { STAGES, stageFromPath, stageHref, stageStatus } from "@/lib/stages";
import { t } from "@/lib/typography";

export function Sidebar() {
  const pathname = usePathname();
  const current = stageFromPath(pathname);
  const [isOpen, setIsOpen] = useState(false);

  // The drawer only exists on mobile, so it is closed directly from the nav
  // links instead of syncing it from an effect on `pathname`.
  return (
    <>
      {/* Mobile drawer trigger — the sidebar itself is a fixed panel on desktop. */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="فتح قائمة المراحل"
        aria-expanded={isOpen}
        className={cx(
          "fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg",
          "bg-surface-container-lowest text-on-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:hidden",
        )}
      >
        <Icon name="menu" className="text-xl" />
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="إغلاق قائمة المراحل"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-[4px] lg:hidden"
        />
      )}

      <aside
        className={cx(
          "fixed inset-y-0 right-0 z-50 flex w-64 flex-col justify-between bg-surface-container-lowest",
          "shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col">
          <div className="px-space-md py-space-sm">
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-space-xs">
              <span className="flex items-center gap-space-xs">
                <Icon name="verified_user" className="text-base text-primary" />
                <span className={cx(t.labelSm, "font-semibold text-on-surface")}>
                  مقياس أمانة النقل
                </span>
                </span>
                <span
                className={cx(
                  t.code,
                  "rounded bg-primary-fixed/40 px-1.5 py-0.5 text-[11px] text-primary-container",
                )}
                >
                حتمي
                </span>
            </div>
          </div>

          <nav aria-label="مراحل التدقيق" className="mt-space-xs space-y-1 px-space-sm">
            {STAGES.map((stage) => {
              const status = stageStatus(stage, current);
              const isActive = status === "active";
              const isDone = status === "done";

              return (
                <Link
                  key={stage.slug}
                  href={stageHref(stage.slug)}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cx(
                    "group flex items-center justify-between rounded-lg px-space-md py-space-sm transition-colors",
                    isActive
                      ? "bg-primary-container font-semibold text-on-primary-container shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  <span className="flex items-center gap-space-sm">
                    <Icon
                      name={isActive || isDone ? stage.doneIcon : stage.icon}
                      filled={isActive || isDone}
                      className={cx(
                        "text-lg",
                        isActive
                          ? "text-on-primary-container"
                          : isDone
                            ? "text-primary"
                            : "text-outline",
                      )}
                    />
                    <span className={t.labelSm}>
                      {stage.ordinal} {stage.title}
                    </span>
                  </span>
                  <span
                    className={cx(
                      t.code,
                      isActive
                        ? "rounded bg-primary/20 px-1.5 py-0.5 text-[11px] text-on-primary-container"
                        : isDone
                          ? "font-semibold text-primary"
                          : "text-outline",
                    )}
                  >
                    {isActive ? "نشط" : isDone ? "مكتمل" : "معلق"}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="m-space-sm flex flex-col gap-space-sm rounded-xl bg-surface-container-low/50 p-space-sm">
          <span className="flex items-center gap-space-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className={cx(t.labelSm, "font-medium text-on-surface")}>
              الفحص الحتمي: يعمل بلا نموذج
            </span>
          </span>
          <p className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>
            الطبقتان الأولى والثانية بحث في جداول مستوردة من الحزمة العلمية، والنتيجة قابلة لإعادة الإنتاج.
          </p>
          <div className="flex items-center justify-between border-t border-surface-container-high/60 pt-2">
            <span className={cx(t.labelSm, "inline-flex items-center gap-1 text-primary font-medium")}>
              <Icon name="verified" className="text-sm" filled />
              موزون ١.٠
            </span>
            <span className={cx(t.code, "text-[11px] text-outline")}>
              يقيس أمانة النقل
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}