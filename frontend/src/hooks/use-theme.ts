"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/utils/theme-storage";
import type { ResolvedTheme, Theme } from "@/types/ui";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode or blocked storage: fall through to the system default.
  }
  return "system";
}

function apply(theme: Theme): ResolvedTheme {
  const resolved: ResolvedTheme = theme === "system" ? (prefersDark() ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

/**
 * Read and write the active theme.
 *
 * The document attribute is set by ThemeScript before paint, so this hook only
 * takes over once React hydrates. It starts as "system" on the server to keep
 * markup identical between server and client render.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    setResolved(apply(stored));
  }, []);

  // Follow the OS only while the user has not made an explicit choice.
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system"));

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolved(apply(next));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage failure only costs persistence, not correctness.
    }
  }, []);

  return { theme, resolvedTheme: resolved, setTheme };
}
