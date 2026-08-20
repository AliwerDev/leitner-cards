export const DECK_COLOR_COUNT = 8;

/** Palette entries, index 0..7. `token` is the CSS var defined in globals.css. */
export const DECK_COLORS = [
  { value: 0, token: "var(--palette-deck-1)", label: "Indigo" },
  { value: 1, token: "var(--palette-deck-2)", label: "Yashil" },
  { value: 2, token: "var(--palette-deck-3)", label: "Qizil" },
  { value: 3, token: "var(--palette-deck-4)", label: "Amber" },
  { value: 4, token: "var(--palette-deck-5)", label: "Ko'k" },
  { value: 5, token: "var(--palette-deck-6)", label: "Fuksiya" },
  { value: 6, token: "var(--palette-deck-7)", label: "Feruza" },
  { value: 7, token: "var(--palette-deck-8)", label: "Kulrang" },
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

export function deckColorToken(color: number | null | undefined, deckId: number): string {
  const index = deckColorIndex(color, deckId);
  return DECK_COLORS[index]!.token;
}

/**
 * Inline style that re-points the accent role for a subtree.
 *
 * Every child using bg-accent / text-accent re-themes automatically, with no
 * prop threading - the payoff of the semantic-role indirection.
 */
export function deckAccentStyle(
  color: number | null | undefined,
  deckId: number,
): React.CSSProperties {
  return { "--color-accent": deckColorToken(color, deckId) } as React.CSSProperties;
}
