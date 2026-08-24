// COPIED FROM frontend/src/lib/api/endpoints/decks.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

import { apiFetch, apiFetchPaginated } from "../client";
import { pageQuery } from "../paginated";
import type { Deck, DeckResponse, DeckStatsResponse, MessageResponse } from "@/types/api";

/**
 * `description` is a MOBILE ADDITION.
 *
 * The backend accepts it and returns it in Deck::fields(), but the web app's
 * DeckInput and deckCreateSchema both omit it, so the web cannot edit a deck
 * description at all. There is no reason for the field to be write-only, so it
 * is included here. Worth adding to the frontend too.
 */
export type DeckInput = {
  name: string;
  description?: string | null;
  color?: number | null;
  direction?: number;
};

/**
 * Every deck the user owns.
 *
 * The endpoint paginates at 20. Regular accounts cap at 3 decks so page 2 is
 * rare, but Premium is unbounded - follow the pages rather than silently
 * showing the first 20.
 */
export async function listDecks(): Promise<Deck[]> {
  const first = await apiFetchPaginated<Deck>("/decks", { query: pageQuery(1) });
  if (first.pagination.pageCount <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: first.pagination.pageCount - 1 }, (_, index) =>
      apiFetchPaginated<Deck>("/decks", { query: pageQuery(index + 2) }),
    ),
  );

  return [...first.items, ...rest.flatMap((page) => page.items)];
}

export async function getDeck(id: number): Promise<Deck> {
  const { deck } = await apiFetch<DeckResponse>(`/decks/${id}`);
  return deck;
}

export async function createDeck(input: DeckInput): Promise<Deck> {
  const { deck } = await apiFetch<DeckResponse>("/decks", { method: "POST", body: input });
  return deck;
}

/**
 * Partial update: Yii's load() only assigns keys present in the body, so send
 * changed keys only. Never send an empty name - it is required, min length 1.
 */
export async function updateDeck(id: number, input: Partial<DeckInput>): Promise<Deck> {
  const { deck } = await apiFetch<DeckResponse>(`/decks/${id}`, { method: "PATCH", body: input });
  return deck;
}

export function deleteDeck(id: number) {
  return apiFetch<MessageResponse>(`/decks/${id}`, { method: "DELETE" });
}

export function getDeckStats(id: number) {
  return apiFetch<DeckStatsResponse>(`/decks/${id}/stats`);
}
