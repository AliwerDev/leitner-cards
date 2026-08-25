import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { qkPrefix } from "@/lib/query/keys";
import { flushPending, readPending, type FlushResult } from "@/lib/utils/pending-reviews";

/**
 * Drain the offline answer outbox whenever there is a reason to think it might
 * succeed: the app coming to the foreground, the network returning, or this
 * hook mounting.
 *
 * Those three cover the realistic recovery paths. Polling would add nothing -
 * nothing else changes whether a queued POST will go through.
 *
 * The flush is held in a ref rather than named in the effect's dependencies.
 * Listing it would tear down and re-add both subscriptions every time
 * `flushing` toggled, which is exactly when an event is most likely to arrive.
 * The ref keeps one stable subscription that always calls current logic.
 *
 * MOUNTED TWICE, ON PURPOSE. The root layout mounts it so syncing is not
 * limited to whichever tab a user happens to open, and the decks and profile
 * screens mount it for the count they display. `busy` below is per-hook, so it
 * cannot coordinate those; the module-level guard inside flushPending is what
 * stops two mounts sending the same batch.
 */
export function usePendingFlush() {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const [flushing, setFlushing] = useState(false);

  // Guards re-entry without making `flushing` a dependency of the flush
  // itself: state updates are async, so two events in the same tick would
  // both see `flushing === false`.
  const busy = useRef(false);

  const refreshCount = useCallback(async () => {
    setCount((await readPending()).length);
  }, []);

  const flush = useCallback(async (): Promise<FlushResult | null> => {
    if (busy.current) return null;
    busy.current = true;
    setFlushing(true);

    try {
      const result = await flushPending();

      // Anything that actually landed changed the server's idea of what is due
      // and what the stats are.
      if (result.sent > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: qkPrefix.dueCount }),
          queryClient.invalidateQueries({ queryKey: qkPrefix.due }),
          queryClient.invalidateQueries({ queryKey: qkPrefix.stats }),
        ]);
      }

      setCount(result.remaining);
      return result;
    } finally {
      busy.current = false;
      setFlushing(false);
    }
  }, [queryClient]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    // Read the queue length, then try to send it. Both are async, so neither
    // sets state synchronously during the effect.
    void readPending()
      .then((entries) => {
        setCount(entries.length);
        if (entries.length > 0) return flushRef.current();
        return null;
      })
      .catch(() => {
        // pending-reviews already swallows storage failures; this is belt and
        // braces so a rejected promise cannot surface as an unhandled error.
      });

    const appState = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active") void flushRef.current();
    });

    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online) void flushRef.current();
    });

    return () => {
      appState.remove();
      unsubscribeOnline();
    };
  }, []);

  return { count, flushing, flush, refreshCount };
}
