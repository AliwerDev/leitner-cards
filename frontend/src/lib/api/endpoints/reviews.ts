import "server-only";

import { apiFetch } from "../client";
import type { DueCountResponse, DueResponse, ResetResponse, ReviewResponse } from "@/types/api";

/**
 * Asks for the whole due queue rather than a page of it.
 *
 * A study session covers every card that is ready, so the client does not pick
 * a page size. The server still bounds the response - it stops at 2000 cards -
 * so a queue can come back short of the true total.
 */
export const ALL_DUE = 0;

export const MAX_DUE_LIMIT = 100;

/**
 * The server's ceiling on an ALL_DUE request, mirrored from
 * ReviewController::ALL_LIMIT_CAP. A queue that comes back this long was cut
 * off, so more cards are still waiting.
 */
export const ALL_DUE_CAP = 2000;

/**
 * The due queue. deckId omitted means every deck.
 *
 * The default is the whole queue. Pass a positive `limit` for one page instead;
 * the server clamps that to 1..100.
 *
 * `count` in the response is the length of what came back, not the true total.
 * Unlike /cards/{id}/progress, this endpoint does not write progress rows.
 */
export function getDueCards(params: { deckId?: number; limit?: number } = {}) {
  const requested = params.limit ?? ALL_DUE;
  const limit =
    requested === ALL_DUE ? ALL_DUE : Math.min(Math.max(requested, 1), MAX_DUE_LIMIT);

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
