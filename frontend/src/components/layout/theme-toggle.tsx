"use client";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import type { Theme } from "@/types/ui";

const OPTIONS: ReadonlyArray<{ value: Theme; label: string; icon: string }> = [
  { value: "light", label: uz.nav.themeLight, icon: "☀" },
  { value: "dark", label: uz.nav.themeDark, icon: "☾" },
  { value: "system", label: uz.nav.themeSystem, icon: "◐" },
];

/** Segmented light / dark / system control. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={uz.nav.theme}
      className="inline-flex gap-3xs rounded-full border border-border bg-surface-sunken p-3xs"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-sm transition-colors",
              "duration-(--duration-fast) ease-out",
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-subtle hover:bg-surface-hover hover:text-fg",
            )}
          >
            <span aria-hidden="true">{option.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
