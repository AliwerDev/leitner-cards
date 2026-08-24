// ADAPTED FROM frontend/src/lib/domain/deck-color.ts
//
// The index math is identical and must stay identical: both apps have to pick
// the same hue for the same deck. What changes is the output. The web returns a
// CSS custom property and re-points --color-accent for a subtree; React Native
// has no cascade, so this returns a resolved hex and the subtree override lives
// in lib/theme/theme-context.tsx as <DeckAccentProvider>.

import { deckColors } from "@/lib/theme/themes";
import type { ResolvedTheme } from "@/types/ui";

export const DECK_COLOR_COUNT = 8;

/** Palette entries, index 0..7. Labels match the web picker. */
export const DECK_COLORS = [
  { value: 0, label: "Indigo" },
  { value: 1, label: "Yashil" },
  { value: 2, label: "Qizil" },
  { value: 3, label: "Amber" },
  { value: 4, label: "Ko'k" },
  { value: 5, label: "Fuksiya" },
  { value: 6, label: "Feruza" },
  { value: 7, label: "Kulrang" },
] as const;

/**
 * Total mapping from the wire value to a palette entry.
 *
 * The column is a plain nullable integer with no server-side range check, so
 * this must be total over all of the integers plus null:
 *   null        -> a stable hue derived from the deck id, so an uncolored deck
 *                  still looks intentional and never shifts between renders.
 *   out of range-> wrapped with a positive modulo, so 8 -> 0 and -1 -> 7.
 *   non-integer -> truncated.
 */
export function deckColorIndex(color: number | null | undefined, deckId: number): number {
  if (color == null || !Number.isFinite(color)) {
    return Math.abs(deckId) % DECK_COLOR_COUNT;
  }
  return ((Math.trunc(color) % DECK_COLOR_COUNT) + DECK_COLOR_COUNT) % DECK_COLOR_COUNT;
}

/**
 * The deck's hue for the active theme, as a hex value.
 *
 * The theme matters: the dark set is lighter, because the light hues go muddy
 * against a near-black surface.
 */
export function deckAccent(
  color: number | null | undefined,
  deckId: number,
  theme: ResolvedTheme,
): string {
  const index = deckColorIndex(color, deckId);
  return deckColors[theme][index] ?? deckColors[theme][0];
}

/** Every swatch for the picker, in palette order. */
export function deckSwatches(theme: ResolvedTheme): readonly string[] {
  return deckColors[theme];
}
