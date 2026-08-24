import { useQuery } from "@tanstack/react-query";
import { getDueCards, getDueCount } from "@/lib/api/endpoints/reviews";
import { qk } from "@/lib/query/keys";

/**
 * The number on the Study tab.
 *
 * Account-wide when deckId is omitted, which is what the badge shows. Note the
 * asymmetry to keep in mind when invalidating: POST /reviews returns a
 * due_count that ignores deckId entirely, so it can be written straight into
 * the `undefined` key but tells you nothing about a per-deck one.
 */
export function useDueCount(deckId?: number) {
  return useQuery({
    queryKey: qk.dueCount(deckId),
    queryFn: () => getDueCount(deckId),
    // The badge is glanced at, not studied. A minute of staleness is
    // invisible, and refetching it on every screen focus is not worth it.
    staleTime: 60_000,
  });
}

/**
 * The study queue.
 *
 * `staleTime: 0` because a queue fetched five minutes ago may contain cards
 * already answered on another device, and starting a session on stale cards
 * produces confusing level jumps.
 */
export function useDueCards(deckId?: number, limit?: number) {
  return useQuery({
    queryKey: [...qk.due(deckId), limit ?? null],
    queryFn: () => getDueCards({ deckId, limit }),
    staleTime: 0,
  });
}
