import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getDueCards, getDueCount } from "@/lib/api/endpoints/reviews";
import { qk } from "@/lib/query/keys";

/**
 * How long a due query survives with no observer.
 *
 * The default five minutes is right for everything that can be refetched on
 * demand, and wrong for the one thing that cannot. A cache collected while the
 * app sits in a pocket is a cache the persister has nothing to write, so a
 * cold start with no network finds an empty queue - the exact case offline
 * study exists for. A week matches the persister's maxAge: anything it would
 * throw away is not worth holding in memory either.
 */
const OFFLINE_GC_TIME = 7 * 24 * 60 * 60 * 1000;

/**
 * How much of the queue is warmed in the background.
 *
 * Bounded rather than the whole queue, because this copy is the one that ends
 * up on disk. AsyncStorage on Android is capped at 6 MB by default, and a
 * 2000-card queue at worst case would exceed it - a real cost of storing JSON
 * rather than using SQLite. Two hundred cards is far more than one session and
 * leaves the on-disk copy comfortably inside the limit.
 */
const PREFETCH_LIMIT = 200;

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
    gcTime: OFFLINE_GC_TIME,
  });
}

/**
 * The study queue.
 *
 * `staleTime: 0` stays, and the original reasoning holds: a queue fetched five
 * minutes ago may contain cards already answered on another device, and
 * starting a session on stale cards produces confusing level jumps.
 *
 * Note what staleTime does and does not do - it marks data for refetch, it
 * does not discard it. Offline the fetch is paused by onlineManager and the
 * stored queue is still returned, which is exactly what offline study needs
 * and the reason networkMode is left at its default. Setting `offlineFirst`
 * here would fire a doomed request and produce an error state to suppress.
 */
export function useDueCards(deckId?: number, limit?: number) {
  return useQuery({
    queryKey: [...qk.due(deckId), limit ?? null],
    queryFn: () => getDueCards({ deckId, limit }),
    staleTime: 0,
    gcTime: OFFLINE_GC_TIME,
  });
}

/**
 * Warm the account-wide queue so it is on disk before the network goes away.
 *
 * The decks list is where a user stands before they tap Study, and it is
 * normally online when they do. Prefetching there means the common offline
 * path - open the app underground, tap Study - finds a queue written minutes
 * ago rather than one from whenever they last studied.
 *
 * THE KEY MUST BE THE ONE THE SESSION READS. useDueCards() with no limit
 * stores under `[...due, null]`, so this writes there too - a prefetch under
 * its own key would sit on disk and never be read by anything. That is also
 * why the bounded fetch below still lands on the unbounded key: what is being
 * warmed is a fallback for the offline case, not a different query.
 *
 * prefetchQuery rather than fetchQuery: a failure here is not worth surfacing,
 * and there is no observer to hand it to. It is also a no-op when the key
 * already holds fresh data, which is what keeps this from re-fetching on every
 * mount of the decks list.
 */
export function usePrefetchDueQueue() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!onlineManager.isOnline()) return;

    void queryClient.prefetchQuery({
      queryKey: [...qk.due(undefined), null],
      queryFn: () => getDueCards({ limit: PREFETCH_LIMIT }),
      // A warm-up, not a session start: it must not re-fire on every focus
      // the way useDueCards would with its staleTime of 0.
      staleTime: 60_000,
      gcTime: OFFLINE_GC_TIME,
    });
  }, [queryClient]);
}
