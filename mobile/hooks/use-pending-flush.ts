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
 * MOUNTED SEVERAL TIMES, ON PURPOSE. The root layout mounts it so syncing is
 * not limited to whichever tab a user happens to open, and the decks and
 * profile screens mount it for the count they display. Nothing here
 * coordinates those mounts: flushPending shares a single in-flight promise, so
 * they collapse into one request and every caller gets its result.
 */
export function usePendingFlush() {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const [flushing, setFlushing] = useState(false);

  const refreshCount = useCallback(async () => {
    setCount((await readPending()).length);
  }, []);

  /*
   * No local re-entry guard. There used to be one, and it was actively
   * harmful: it returned null to whichever caller arrived second, so a user
   * tapping retry while a reconnect-triggered flush was in flight got no
   * result at all and the UI concluded nothing had been sent. Deduplication
   * belongs in flushPending, which shares one promise across every caller and
   * hands them all the same real answer.
   */
  const flush = useCallback(async (): Promise<FlushResult> => {
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
