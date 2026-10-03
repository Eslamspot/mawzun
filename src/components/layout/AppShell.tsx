"use client";

import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ToastProvider } from "@/context/ToastContext";

/**
 * Persistent chrome shared by every stage: the fixed TopBar and the scrolling
 * canvas, wrapped in the Toast provider. The audit state lives in
 * `AuditProvider`, mounted by the root layout.
 *
 * There is no sidebar: navigation is the step rail that the workspace renders
 * itself, so a second copy in the chrome duplicated the same five links and
 * cost 256px of a phone screen for nothing.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface text-on-surface">
        <TopBar />
        <main className="w-full min-h-screen bg-surface px-gutter pt-16 pb-margin">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}