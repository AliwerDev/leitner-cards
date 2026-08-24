// COPIED FROM frontend/src/lib/api/endpoints/cards.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

import { apiFetch, apiFetchPaginated } from "../client";
import { pageQuery, type Paginated } from "../paginated";
import { PAGE_SIZE } from "@/lib/domain/limits";
import type {
  Card,
  CardBulkResponse,
  CardProgressResponse,
  CardResponse,
  MessageResponse,
} from "@/types/api";

export const CARD_PAGE_SIZE = PAGE_SIZE;

export type CardListQuery = {
  deckId: number;
  q?: string;
  page?: number;
};

/** deckId is required: omitting it returns 422, not an unfiltered list. */
export function listCards({ deckId, q, page }: CardListQuery): Promise<Paginated<Card>> {
  return apiFetchPaginated<Card>("/cards", {
    query: { deckId, q, ...pageQuery(page, CARD_PAGE_SIZE) },
  });
}

/**
 * Total card count for a deck.
 *
 * The quota payload has no per-deck usage, so the count comes from the
 * pagination header with the cheapest possible page.
 */
export async function countCards(deckId: number): Promise<number> {
  const { pagination } = await apiFetchPaginated<Card>("/cards", {
    query: { deckId, ...pageQuery(1, 1) },
  });
  return pagination.totalCount;
}

export async function getCard(id: number): Promise<Card> {
  const { card } = await apiFetch<CardResponse>(`/cards/${id}`);
  return card;
}

export async function createCard(input: {
  deckId: number;
  front: string;
  back: string;
}): Promise<Card> {
  const { card } = await apiFetch<CardResponse>("/cards", { method: "POST", body: input });
  return card;
}

/**
 * Create many cards in one request.
 *
 * The backend wraps the insert in a transaction, so a rejected batch leaves the
 * deck untouched - there is no partial result to reconcile here.
 */
export async function createCards(input: {
  deckId: number;
  cards: { front: string; back: string }[];
}): Promise<CardBulkResponse> {
  return apiFetch<CardBulkResponse>("/cards/bulk", { method: "POST", body: input });
}

export async function updateCard(
  id: number,
  input: { front?: string; back?: string },
): Promise<Card> {
  const { card } = await apiFetch<CardResponse>(`/cards/${id}`, { method: "PATCH", body: input });
  return card;
}

/**
 * Move a card to another deck.
 *
 * The update endpoint reads snake_case `deck_id` here, unlike create and list
 * which take `deckId`. Isolated in this function so no caller has to remember.
 */
export async function moveCard(id: number, deckId: number): Promise<Card> {
  const { card } = await apiFetch<CardResponse>(`/cards/${id}`, {
    method: "PATCH",
    body: { deck_id: deckId },
  });
  return card;
}

export function deleteCard(id: number) {
  return apiFetch<MessageResponse>(`/cards/${id}`, { method: "DELETE" });
}

/**
 * WARNING: this GET has a write side effect. ReviewService::progressFor()
 * inserts a card_progress row when none exists, which also inflates
 * stats.not_started. Call it only from an explicit user action - never from a
 * list, a hover, or a prefetch.
 */
export function getCardProgress(id: number) {
  return apiFetch<CardProgressResponse>(`/cards/${id}/progress`);
}
