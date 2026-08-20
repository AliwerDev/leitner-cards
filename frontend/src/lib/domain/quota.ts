import type { Quota } from "@/types/api";
import { uz } from "@/lib/i18n/uz";

/**
 * Pure predicates over the quota payload.
 *
 * The principle: never let the user reach a form they cannot submit. A 422
 * after typing a deck name is a wasted interaction.
 */

export function canCreateDeck(quota: Quota): boolean {
  return quota.decks_remaining === null || quota.decks_remaining > 0;
}

/** True when only one deck slot is left, so the UI can warn in advance. */
export function isLastDeckSlot(quota: Quota): boolean {
  return quota.decks_remaining === 1;
}

export function decksLabel(quota: Quota): string {
  if (quota.max_decks === null) return uz.quota.decksUnlimited;
  return uz.quota.decksLabel(quota.decks_used, quota.max_decks);
}

/**
 * Per-deck card usage is NOT in the quota payload, so the count has to be
 * supplied by the caller (see countCards in lib/api/endpoints/cards.ts).
 */
export function isDeckFull(cardCount: number, quota: Quota): boolean {
  return quota.max_cards_per_deck !== null && cardCount >= quota.max_cards_per_deck;
}

export function cardsLabel(cardCount: number, quota: Quota): string {
  if (quota.max_cards_per_deck === null) return `${cardCount} ${uz.deck.cardCount}`;
  return uz.quota.cardsLabel(cardCount, quota.max_cards_per_deck);
}

/** Tone for a usage bar: warns before the limit rather than at it. */
export function usageTone(used: number, max: number | null): "accent" | "warning" | "danger" {
  if (max === null) return "accent";
  const ratio = used / max;
  if (ratio >= 1) return "danger";
  if (ratio >= 0.9) return "warning";
  return "accent";
}

export function deckLimitMessage(quota: Quota): string {
  return quota.max_decks === null ? "" : uz.quota.deckLimitReached(quota.max_decks);
}

export function cardLimitMessage(quota: Quota): string {
  return quota.max_cards_per_deck === null
    ? ""
    : uz.quota.cardLimitReached(quota.max_cards_per_deck);
}
