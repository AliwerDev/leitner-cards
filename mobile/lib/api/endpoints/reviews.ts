// COPIED FROM frontend/src/lib/api/endpoints/reviews.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

import { apiFetch } from "../client";
import type { DueCountResponse, DueResponse, ResetResponse, ReviewResponse } from "@/types/api";

export const DEFAULT_DUE_LIMIT = 20;
export const MAX_DUE_LIMIT = 100;

/**
 * The due queue. deckId omitted means every deck.
 *
 * `count` in the response is the length of this page, not a total - the server
 * clamps limit to 1..100. Unlike /cards/{id}/progress, this endpoint does not
 * write progress rows.
 */
export function getDueCards(params: { deckId?: number; limit?: number } = {}) {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_DUE_LIMIT, 1), MAX_DUE_LIMIT);
  return apiFetch<DueResponse>("/reviews/due", {
    query: { deckId: params.deckId, limit },
  });
}

export function getDueCount(deckId?: number) {
  return apiFetch<DueCountResponse>("/reviews/count", { query: { deckId } });
}

/** Returns 201. The due_count in the response is account-wide. */
export function submitReview(input: { cardId: number; wasCorrect: boolean }) {
  return apiFetch<ReviewResponse>("/reviews", { method: "POST", body: input });
}

/** Sets the card back to level 1, due now. Writes no history row. */
export function resetCard(cardId: number) {
  return apiFetch<ResetResponse>("/reviews/reset", { method: "POST", body: { cardId } });
}
