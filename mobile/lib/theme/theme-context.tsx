import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { themes, type ThemeColors } from "./themes";
import { duration, elevation, fontSize, leading, measure, radius, space, tracking, weight, layout } from "./tokens";
import type { ResolvedTheme, Theme } from "@/types/ui";

/**
 * The theme provider, and the mobile answer to two web mechanisms.
 *
 * 1. Tri-state preference. `light | dark | system` persisted under the same
 *    storage key the web uses, so the two apps describe the setting the same
 *    way. "system" is the default and follows useColorScheme().
 *
 * 2. Deck accent override. On the web, deckAccentStyle() re-points the
 *    --color-accent custom property for a subtree, and every child using
 *    bg-accent re-themes with no prop threading. React Native has no cascade,
 *    so the equivalent is a nested provider: wrap a subtree in
 *    <DeckAccentProvider color={...} deckId={...}> and children reading
 *    theme.colors.accent see the deck's hue instead. Same payoff, same lack of
 *    prop threading, and no runtime style resolution pass.
 */

export const THEME_STORAGE_KEY = "leitner-theme";

export type ThemeValue = {
  colors: ThemeColors;
  resolved: ResolvedTheme;
  preference: Theme;
  setPreference: (next: Theme) => void;
  space: typeof space;
  measure: typeof measure;
  radius: typeof radius;
  fontSize: typeof fontSize;
  leading: typeof leading;
  weight: typeof weight;
  tracking: typeof tracking;
  duration: typeof duration;
  elevation: typeof elevation;
  layout: typeof layout;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<Theme>("system");

  // Read the stored preference once. The first paint uses "system", which is
  // the right guess for most users and avoids blocking the splash on a disk
  // read; a stored override lands a frame later.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (active && isTheme(stored)) setPreferenceState(stored);
      })
      .catch(() => {
        // A failed read means the default. Never block rendering on storage.
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: Theme) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
      // The choice still applies for this session even if it does not persist.
    });
  }, []);

  const resolved: ResolvedTheme =
    preference === "system" ? (system === "dark" ? "dark" : "light") : preference;

  const value = useMemo<ThemeValue>(
    () => ({
      colors: themes[resolved],
      resolved,
      preference,
      setPreference,
      space,
      measure,
      radius,
      fontSize,
      leading,
      weight,
      tracking,
      duration,
      elevation,
      layout,
    }),
    [resolved, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error("useTheme must be used inside a ThemeProvider.");
  return value;
}

/**
 * Re-point the accent role for a subtree to a deck's color.
 *
 * The hover shade is darkened by a fixed step rather than mixed in oklab the
 * way the web does it: the deck palette has no second shade per hue, and a
 * per-render color-space conversion is not worth it for a pressed state.
 */
export function DeckAccentProvider({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  const parent = useTheme();

  const value = useMemo<ThemeValue>(
    () => ({
      ...parent,
      colors: { ...parent.colors, accent, accentHover: shade(accent, 0.85) },
    }),
    [parent, accent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Multiply a #rrggbb color toward black. `amount` of 0.85 keeps 85%. */
function shade(hex: string, amount: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null || match[1] === undefined) return hex;
  const value = Number.parseInt(match[1], 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return (
    "#" +
    channels
      .map((channel) =>
        Math.round(channel * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
