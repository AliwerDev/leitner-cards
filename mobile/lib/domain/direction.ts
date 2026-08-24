// COPIED FROM frontend/src/lib/domain/direction.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

import { DeckDirection } from "@/types/api";
import { uz } from "@/lib/i18n/uz";

/**
 * deck.direction is nullable in the DB and fields() serializes the raw column,
 * so old rows can arrive as null while direction_label still reads
 * "Old -> Orqa". Normalize here, once, and never switch on the raw value.
 */
export function normalizeDirection(direction: DeckDirection | null | undefined): DeckDirection {
  return direction === DeckDirection.BackToFront
    ? DeckDirection.BackToFront
    : DeckDirection.FrontToBack;
}

export function directionLabel(direction: DeckDirection | null | undefined): string {
  return normalizeDirection(direction) === DeckDirection.BackToFront
    ? uz.deck.directionBackToFront
    : uz.deck.directionFrontToBack;
}

export const DIRECTION_OPTIONS = [
  { value: DeckDirection.FrontToBack, label: uz.deck.directionFrontToBack },
  { value: DeckDirection.BackToFront, label: uz.deck.directionBackToFront },
] as const;
