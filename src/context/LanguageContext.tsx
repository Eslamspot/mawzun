"use client";

/**
 * Interface language — Arabic-first, English on demand.
 *
 * Same external-store pattern as the theme: the server snapshot is Arabic,
 * and the stored choice appears once the client subscribes. Switching flips
 * `lang`/`dir` on <html>; every static chrome string resolves through the
 * dictionary in `lib/i18n`. Package data and engine output stay Arabic by
 * product scope (see the dictionary header).
 */

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { STRINGS, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "mawzun_lang";

const LanguageContext = createContext<{ lang: Lang; toggle: () => void; s: (key: string) => string } | undefined>(
  undefined,
);

// --- external store -------------------------------------------------------

let storeLang: Lang | null = null;
const listeners = new Set<() => void>();

function readLang(): Lang {
  if (storeLang) return storeLang;
  if (typeof window === "undefined") return "ar";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    storeLang = stored === "en" ? "en" : "ar";
  } catch {
    storeLang = "ar";
  }
  return storeLang;
}

/** Synchronous snapshot for non-component readers (validation messages). */
export function currentLang(): Lang {
  return readLang();
}

function getServerSnapshot(): Lang {
  return "ar";
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function applyToDocument(next: Lang): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = next;
  document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
}

function writeLang(next: Lang): void {
  storeLang = next;
  applyToDocument(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Persistence is a nicety, not correctness.
  }
  for (const listener of listeners) listener();
}

// -------------------------------------------------------------------------

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, getServerSnapshot);

  const toggle = useCallback(() => {
    writeLang(readLang() === "ar" ? "en" : "ar");
  }, []);

  const s = useCallback(
    (key: string): string => STRINGS[lang][key] ?? key,
    [lang],
  );

  return <LanguageContext.Provider value={{ lang, toggle, s }}>{children}</LanguageContext.Provider>;
}

export function useLang(): { lang: Lang; toggle: () => void; s: (key: string) => string } {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLang must be used inside LanguageProvider");
  return context;
}
