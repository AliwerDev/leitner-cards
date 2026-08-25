import { onlineManager, useIsRestoring } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useDueCards } from "@/hooks/use-due";
import { withoutPending } from "@/lib/query/offline-queue";
import { readPending } from "@/lib/utils/pending-reviews";
import type { DueCard } from "@/types/api";

/**
 * The queue a study screen should render, and whether it came from disk.
 *
 * Four things are folded together here so neither study screen has to do it:
 * the stored queue minus anything already sitting in the outbox, whether the
 * device is online, whether the cache is still being read, and the key that
 * decides when a session remounts.
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

  const session = useSessionQueue(cards, query.data?.count ?? 0);

  /**
   * The summary's "more cards left" button.
   *
   * Refetching is not enough on its own: the held queue below must be told to
   * let go, or the next queue would be treated as the same session and the
   * summary would stay on screen. So the session is released first, then the
   * request goes out.
   */
  const { release } = session;
  const [awaitingNext, setAwaitingNext] = useState(false);

  const nextQueue = useCallback(async () => {
    release();
    setAwaitingNext(true);

    try {
      await query.refetch();
    } finally {
      setAwaitingNext(false);
    }
  }, [release, query]);

  return {
    cards: session.cards,
    /** The server's count for the queue, used to detect a capped response. */
    count: session.count,
    /** A React key that changes only for a genuinely new queue. */
    sessionKey: session.key,
    nextQueue,
    /**
     * A queue is on its way and the previous one is already let go.
     *
     * The screens read this as a loading state. Without it the moment between
     * releasing a finished session and its replacement arriving renders the
     * "no cards" screen, because the cached queue the session just worked
     * through is empty by then.
     */
    awaitingNext,
    /** True once there is something to study, from the network or from disk. */
    hasData: query.data !== undefined,
    isRestoring,
    online,
    query,
  };
}

/**
 * Hold the queue still for the length of one session.
 *
 * A session answers cards by editing the cached queue: removeFromCachedQueues
 * takes each answered card out of it so the badge and the stored queue stay
 * honest with no network. That makes `cards` shrink by one on every answer,
 * and the study screens key their session component on the queue. The result
 * was a session that remounted after each answer - the header counter read
 * 1/21, then 1/20, then 1/19, because the reducer restarted at index 0 against
 * a queue one card shorter each time.
 *
 * The fix is to separate the two readers. The cache stays authoritative for
 * the badge and for a cold start, and it keeps shrinking. The session reads a
 * copy taken when it began, which does not.
 *
 * The held copy is replaced when there is nothing held, or when `release` says
 * the session is over - the summary asking for the next queue, or the screen
 * unmounting. Nothing else moves it, so no cache edit can remount a session
 * mid-answer.
 */
function useSessionQueue(cards: DueCard[], count: number) {
  /*
   * State rather than a ref, and adjusted during render rather than in an
   * effect. This is the "derive state from props" pattern from the React docs:
   * the new queue must be visible on the render that first sees it, and an
   * effect would let one render through with the old queue and the new key.
   */
  const [held, setHeld] = useState<Held | null>(null);
  const [epoch, setEpoch] = useState(0);

  if (held === null && cards.length > 0) {
    setHeld({ cards, count, epoch });
  }

  /** End the session, so the next queue to arrive is taken up as a new one. */
  const release = useCallback(() => {
    setHeld(null);
    setEpoch((previous) => previous + 1);
  }, []);

  return {
    // Before any queue has arrived nothing is held, and the empty array is
    // what the screens' "no cards" branch reads.
    cards: held?.cards ?? cards,
    count: held?.count ?? count,
    // The epoch, not the card ids: it moves only when a session is released,
    // and ids would put the shrinking cache back in charge of remounting.
    key: `queue-${held?.epoch ?? epoch}`,
    release,
  };
}

type Held = { cards: DueCard[]; count: number; epoch: number };

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
