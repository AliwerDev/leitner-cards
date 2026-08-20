"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { uz } from "@/lib/i18n/uz";
import { Tooltip } from "@/components/ui";
import type { Theme } from "@/types/ui";

/** light -> dark -> system -> light. */
const ORDER: readonly Theme[] = ["light", "dark", "system"];

const META: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: uz.nav.themeLight },
  dark: { icon: Moon, label: uz.nav.themeDark },
  system: { icon: SunMoon, label: uz.nav.themeSystem },
};

/**
 * One button that steps through the three theme settings.
 *
 * The segmented ThemeToggle shows all three at once, which is the better
 * control on a settings page. In a single row of nav chrome it costs three
 * slots, so this trades the overview for space and keeps the current state
 * visible as the icon.
 */
export function ThemeCycle() {
  const { theme, setTheme } = useTheme();

  const { icon: Icon, label } = META[theme];
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "light";

  return (
    <Tooltip content={`${uz.nav.theme}: ${label}`}>
      <button
        type="button"
        aria-label={`${uz.nav.theme}: ${label}`}
        onClick={() => setTheme(next)}
        className={
          "text-fg-muted hover:bg-surface-hover hover:text-fg flex size-9 flex-none " +
          "items-center justify-center rounded-full transition-colors " +
          "duration-(--duration-fast) ease-out"
        }
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
