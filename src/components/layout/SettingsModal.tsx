"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { useToast } from "@/context/ToastContext";
import { useAudit } from "@/context/AuditContext";
import { useLang } from "@/context/LanguageContext";

/**
 * Settings.
 *
 * The previous version exposed strictness levels, an auto-repair switch and an
 * audio toggle — none of which changed any behaviour. A control that does
 * nothing is worse than no control, so this screen now states where the real
 * policy lives and offers the one action that has an effect: clearing the run.
 *
 * Strictness is a property of the constraint bank, not of a slider: what is
 * checked is what the bank declares, and the bank travels in the record.
 */
export function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { reset } = useAudit();
  const { s } = useLang();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-inverse-surface/20 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-5 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container text-primary">
              <Icon name="tune" className="text-base" />
            </span>
            <span className={cx(t.label, "font-bold text-on-surface")}>{s("st.title")}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-2 rounded-md"
            aria-label={s("st.close")}
          >
            <Icon name="close" className="text-base" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className={cx(t.labelSm, "font-semibold text-on-surface")}>{s("st.bank.t")}</span>
            <span className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>{s("st.bank.x")}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className={cx(t.labelSm, "font-semibold text-on-surface")}>{s("st.force.t")}</span>
            <span className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>{s("st.force.x")}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className={cx(t.labelSm, "font-semibold text-on-surface")}>{s("st.scope.t")}</span>
            <span className={cx(t.bodySm, "leading-relaxed text-on-surface-variant")}>{s("st.scope.x")}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-container">
          <button
            type="button"
            onClick={() => {
              reset();
              toast({ title: s("st.cleared"), variant: "info" });
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-error hover:bg-error-container/40 transition-colors font-label-sm text-xs font-semibold"
          >
            <Icon name="restart_alt" className="text-sm" />
            {s("st.clear")}
          </button>
        </div>
      </div>
    </div>
  );
}
