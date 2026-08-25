import type { QueryClient } from "@tanstack/react-query";
import { qk, qkPrefix } from "@/lib/query/keys";
import type { DueCard, DueCountResponse, DueResponse } from "@/types/api";

/**
 * Keeping the cached queue honest about answers the server has not seen yet.
 *
 * The queue on disk is whatever the server last said was due. Answer five
 * cards on a plane and it is now wrong by five, but the server cannot be told
 * and the cache cannot be invalidated - there is nothing to refetch from. So
 * the client edits its own cache: an answered card comes out of every cached
 * queue, and the badge comes down by one.
 *
 * This is a local overlay, not a second source of truth. The moment a real
 * response arrives it overwrites all of it, which is the correct precedence -
 * the server knows about the user's other devices and this does not.
 */

/** Drop one answered card from every cached due queue, deck-scoped or not. */
export function removeFromCachedQueues(queryClient: QueryClient, cardId: number): void {
  queryClient.setQueriesData<DueResponse>({ queryKey: qkPrefix.due }, (previous) => {
    if (!previous) return previous;

    const cards = previous.cards.filter((card) => card.id !== cardId);
    if (cards.length === previous.cards.length) return previous;

    /*
     * `count` moves with the array. The summary reads it against ALL_DUE_CAP
     * to decide whether more cards are waiting, so a queue that arrived at the
     * cap must stop claiming to be full once the user has worked through part
     * of it.
     */
    return { count: Math.max(0, previous.count - 1), cards };
  });
}

/**
 * Bring the badge down by one from local state.
 *
 * Online this is redundant - POST /reviews returns an authoritative due_count
 * that overwrites it a moment later. Offline it is the only thing keeping the
 * badge from claiming twenty cards are waiting while the user answers them.
 *
 * Both the account-wide key and the deck-scoped one are written: the badge
 * reads the first, a deck screen reads the second, and an answer changes both.
 */
export function decrementCachedDueCount(queryClient: QueryClient, deckId?: number): void {
  const keys = deckId === undefined ? [qk.dueCount()] : [qk.dueCount(), qk.dueCount(deckId)];

  for (const key of keys) {
    queryClient.setQueryData<DueCountResponse>(key, (previous) =>
      previous ? { due_count: Math.max(0, previous.due_count - 1) } : previous,
    );
  }
}

/**
 * Filter a rehydrated queue against the outbox before a session opens.
 *
 * Reopening study offline must not re-serve a card answered ten minutes ago.
 * The cache edits above handle the in-process case; this handles the one where
 * the app was killed and the cache came back from disk in whatever state the
 * throttled persister last wrote it.
 */
export function withoutPending(
  cards: DueCard[],
  pendingCardIds: ReadonlySet<number>,
): DueCard[] {
  return pendingCardIds.size === 0
    ? cards
    : cards.filter((card) => !pendingCardIds.has(card.id));
}
