import type { QueryClient } from "@tanstack/react-query";
import { qkPrefix } from "@/lib/query/keys";

/**
 * Refresh everything a finished study session made stale.
 *
 * A session writes reviews. That changes the due queue, the badge, the
 * account-wide stats, the daily chart, and the per-deck counts and level bars.
 * The session keeps `dueCount` and the queue roughly right as it goes with
 * local cache edits, but those are an overlay: they know nothing about cards
 * that came due while the session ran, about the user's other devices, or
 * about the new level of every card just answered.
 *
 * WHY THIS IS ONE FUNCTION. It used to be three invalidate calls copied into
 * each study screen, and they had drifted: neither screen invalidated
 * `dueCount`, so the badge kept the number the session had decremented
 * locally, and only the deck-scoped screen refreshed deck stats - for its own
 * deck. An all-decks session changes every deck's counts.
 *
 * WHY IT IS CHEAP. Invalidation is not a request. React Query marks the
 * matching queries stale and refetches only the ones a mounted screen is
 * watching; the rest are refetched when something next reads them. Leaving a
 * study session unmounts the queue, so this typically costs the badge request
 * plus whatever the screen behind it displays - not one request per key.
 *
 * The `decks` prefix is the one to notice: qk.deckStats(id) is
 * ["decks", id, "stats"], so this prefix covers every deck's counts and level
 * board without listing deck ids. It also catches the deck list and the deck
 * detail queries, which are cheap and no less stale after a session.
 */
export function refreshAfterStudy(queryClient: QueryClient): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: qkPrefix.due }),
    queryClient.invalidateQueries({ queryKey: qkPrefix.dueCount }),
    queryClient.invalidateQueries({ queryKey: qkPrefix.stats }),
    queryClient.invalidateQueries({ queryKey: qkPrefix.decks }),
  ]).then(() => undefined);
}
