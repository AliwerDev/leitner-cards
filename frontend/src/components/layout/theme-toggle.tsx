"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import type { Theme } from "@/types/ui";

const OPTIONS: ReadonlyArray<{
  value: Theme;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: uz.nav.themeLight, icon: Sun },
  { value: "dark", label: uz.nav.themeDark, icon: Moon },
  { value: "system", label: uz.nav.themeSystem, icon: SunMoon },
];

/** Segmented light / dark / system control. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={uz.nav.theme}
      className="gap-3xs p-3xs border-border bg-surface-sunken inline-flex rounded-full border"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        const Icon = option.icon;
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
              "flex size-8 items-center justify-center rounded-full transition-colors",
              "duration-(--duration-fast) ease-out",
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-subtle hover:bg-surface-hover hover:text-fg",
            )}
          >
            <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
