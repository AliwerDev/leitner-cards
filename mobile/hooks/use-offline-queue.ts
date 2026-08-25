import { onlineManager, useIsRestoring } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useDueCards } from "@/hooks/use-due";
import { withoutPending } from "@/lib/query/offline-queue";
import { readPending } from "@/lib/utils/pending-reviews";

/**
 * The queue a study screen should render, and whether it came from disk.
 *
 * Three things are folded together here so neither study screen has to do it:
 * the stored queue minus anything already sitting in the outbox, whether the
 * device is online, and whether the cache is still being read.
 */
export function useOfflineQueue(deckId?: number) {
  const query = useDueCards(deckId);
  const isRestoring = useIsRestoring();
  const online = useOnline();

  /*
   * Read once, on mount, and deliberately not again.
   *
   * Cards answered DURING this session are already removed from the cache by
   * removeFromCachedQueues, and the session freezes its own queue at the start
   * anyway. A reactive set would grow mid-session and splice cards out from
   * under the current index, which is a much worse bug than the one it would
   * be fixing.
   */
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set());

  useEffect(() => {
    let active = true;

    void readPending()
      .then((entries) => {
        if (active) setPendingIds(new Set(entries.map((entry) => entry.cardId)));
      })
      .catch(() => {
        // readPending already swallows storage failures; this only stops a
        // rejected promise surfacing as an unhandled error.
      });

    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(
    () => withoutPending(query.data?.cards ?? [], pendingIds),
    [query.data, pendingIds],
  );

  return {
    cards,
    /** The server's count for the queue, used to detect a capped response. */
    count: query.data?.count ?? 0,
    /** True once there is something to study, from the network or from disk. */
    hasData: query.data !== undefined,
    isRestoring,
    online,
    query,
  };
}

/**
 * onlineManager as a React value.
 *
 * It is already wired to NetInfo in lib/query/client.ts, so subscribing here
 * costs nothing and avoids a second listener with its own idea of connectivity.
 */
function useOnline(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
