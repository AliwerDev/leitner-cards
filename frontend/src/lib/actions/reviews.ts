"use server";

import { revalidatePath } from "next/cache";
import * as reviewsApi from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { actionError, actionOk, type ActionResult } from "@/lib/utils/result";
import type { CardLevel } from "@/types/api";

export type AnswerResult = {
  levelBefore: CardLevel;
  levelAfter: CardLevel;
  isMastered: boolean;
};

/**
 * Record one answer.
 *
 * Deliberately does NOT revalidate: the study queue is client state, and
 * re-fetching /reviews/due mid-session would reshuffle the deck under the user
 * because the card just answered has been rescheduled.
 */
export async function submitReviewAction(
  cardId: number,
  wasCorrect: boolean,
): Promise<ActionResult<AnswerResult>> {
  try {
    const result = await reviewsApi.submitReview({ cardId, wasCorrect });
    return actionOk({
      levelBefore: result.review.level_before,
      levelAfter: result.review.level_after,
      isMastered: result.progress.is_mastered,
    });
  } catch (error) {
    if (error instanceof ApiError) return actionError(apiErrorMessage(error));
    return actionError(uz.errors.unexpected);
  }
}

export async function resetCardAction(cardId: number): Promise<ActionResult> {
  try {
    await reviewsApi.resetCard(cardId);
    return actionOk(undefined);
  } catch (error) {
    if (error instanceof ApiError) return actionError(apiErrorMessage(error));
    return actionError(uz.errors.unexpected);
  }
}

/** Called once when a session ends, so badges and stats catch up. */
export async function refreshAfterSessionAction(deckId?: number): Promise<void> {
  revalidatePath("/decks");
  revalidatePath("/stats");
  if (deckId) revalidatePath(`/decks/${deckId}`);
}
