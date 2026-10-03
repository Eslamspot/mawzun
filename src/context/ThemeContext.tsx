"use client";

/**
 * Theme state — light workspace by default, dark on demand.
 *
 * Persistence goes through a tiny external store (the same pattern as
 * `AuditContext`), so no effect calls `setState`: the server snapshot is
 * always light, and the stored choice appears once the client subscribes.
 * The layout's bootstrap script reads the same key before first paint, so
 * the page never flashes the wrong theme.
 *
 * Colours themselves are runtime CSS variables (see globals.css), so no
 * component needs a `dark:` variant — the tokens flip underneath the same
 * utilities when `.dark` lands on <html>.
 */

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "mawzun_theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | undefined>(undefined);

// --- external store -------------------------------------------------------

let storeTheme: Theme | null = null;
const listeners = new Set<() => void>();

function readTheme(): Theme {
  if (storeTheme) return storeTheme;
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    storeTheme = stored === "dark" || stored === "light" ? stored : fallbackTheme();
  } catch {
    storeTheme = fallbackTheme();
  }
  return storeTheme;
}

function fallbackTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function writeTheme(next: Theme): void {
  storeTheme = next;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Persistence is a nicety, not correctness.
  }
  for (const listener of listeners) listener();
}

// -------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  const toggle = useCallback(() => {
    writeTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
