// COPIED FROM frontend/src/lib/api/endpoints/reviews.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

import { apiFetch } from "../client";
import type {
  CardLevel,
  DueCountResponse,
  DueResponse,
  ResetResponse,
  ReviewResponse,
} from "@/types/api";

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

/**
 * Returns 201 for a new answer, 200 when `clientId` matched one already
 * recorded. The due_count in the response is account-wide.
 *
 * `reviewedAt` and `clientId` are optional and only the offline path sends
 * them: the first preserves the real answer time so the Leitner interval is
 * measured from when the card was recalled, the second makes a retry safe to
 * send twice. The web passes neither.
 */
export function submitReview(input: {
  cardId: number;
  wasCorrect: boolean;
  /** Unix SECONDS, not milliseconds. */
  reviewedAt?: number;
  clientId?: string;
}) {
  return apiFetch<ReviewResponse>("/reviews", { method: "POST", body: input });
}

/** Sets the card back to level 1, due now. Writes no history row. */
export function resetCard(cardId: number) {
  return apiFetch<ResetResponse>("/reviews/reset", { method: "POST", body: { cardId } });
}

/*
 * Everything above this point matches frontend/src/lib/api/endpoints/reviews.ts.
 * Below is mobile-only: the web has no outbox, so it has no batch to flush.
 */

export type BatchReviewInput = {
  cardId: number;
  wasCorrect: boolean;
  /** Unix SECONDS - the backend stores every timestamp as a second integer. */
  reviewedAt: number;
  clientId: string;
};

/**
 * One item's outcome. Three statuses, because the outbox has three responses:
 * applied and duplicate both mean "it is on the server, drop it"; rejected
 * means "it will never succeed, drop it"; failed means "keep it and retry".
 */
export type BatchReviewResult = {
  clientId: string | null;
  status: "applied" | "duplicate" | "rejected" | "failed";
  level_after?: CardLevel;
  error?: string;
};

export type BatchReviewResponse = {
  /** Account-wide, computed once after the whole batch. */
  due_count: number;
  results: BatchReviewResult[];
};

/**
 * Flush a slice of the outbox.
 *
 * Always 200 when the request itself was understood, whatever the items did -
 * the HTTP code reports the transport, and the per-item status reports the
 * outcome. Send at most MAX_BATCH (100) items, oldest first.
 */
export function submitReviewBatch(reviews: BatchReviewInput[]) {
  return apiFetch<BatchReviewResponse>("/reviews/batch", {
    method: "POST",
    body: { reviews },
  });
}
