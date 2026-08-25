import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import Constants from "expo-constants";

/**
 * Writing the query cache to disk, so a study session opens with no network.
 *
 * WHY THIS AND NOT SQLITE. The only thing that has to survive a cold start is
 * the due queue and the handful of lists around it - a few hundred KB of JSON
 * already shaped exactly the way the screens read it. A database buys indexed
 * queries nobody issues, and costs a native module, which costs Expo Go. This
 * is the cheaper half of the trade, taken deliberately.
 *
 * WHAT IT DOES NOT DO. Persisting the cache does not make writes work offline;
 * that is the outbox in lib/utils/pending-reviews.ts. This file only ensures
 * there is something to study.
 */

const KEY = "leitner-query-cache";

/**
 * Bumped when a persisted shape stops being readable by this build.
 *
 * Tied to the app version rather than incremented by hand: a release that
 * changes a payload shape gets a fresh cache for free, and one that does not
 * is unaffected because the string is unchanged. The alternative - a
 * hand-maintained integer - is a line every developer forgets exactly once,
 * and the symptom is a crash on somebody else's phone.
 */
const CACHE_BUSTER = `v1-${Constants.expoConfig?.version ?? "dev"}`;

/**
 * How stale a rehydrated cache may be before it is thrown away.
 *
 * Seven days matches MAX_AGE_MS in the outbox, for the same reason: a queue
 * older than that describes a schedule the server has long since moved past,
 * and studying it produces level transitions computed from levels that are no
 * longer true. Below that ceiling, stale-and-present beats absent - a week-old
 * queue is still the user's cards.
 */
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Which query families are worth a disk write.
 *
 * An allowlist, not a denylist. A denylist means every query added later is
 * persisted by accident, and the one that matters most - the session - is the
 * one that must never touch AsyncStorage: it carries the user object, and
 * SecureStore exists precisely because AsyncStorage is not the place for it.
 */
const PERSISTED_ROOTS: readonly string[] = ["due", "dueCount", "decks", "cards", "stats"];

/**
 * Errored queries are excluded as well as unlisted ones. Persisting a failure
 * means a cold start rehydrates into an error state with no data, which is
 * strictly worse than rehydrating into nothing and fetching.
 */
export function shouldDehydrateQuery(query: Query): boolean {
  if (query.state.status !== "success") return false;

  const root = query.queryKey[0];

  return typeof root === "string" && PERSISTED_ROOTS.includes(root);
}

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: KEY,
  /**
   * A session writes due_count into the cache after every answer, and every
   * write triggers a dehydrate. Without a throttle that is a full
   * JSON.stringify of the whole cache per card, on the JS thread, between a
   * tap and the next prompt. Two seconds is far above the answer cadence and
   * well below the interval at which the app is realistically killed.
   */
  throttleTime: 2_000,
});

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: asyncStoragePersister,
  maxAge: MAX_AGE,
  buster: CACHE_BUSTER,
  dehydrateOptions: { shouldDehydrateQuery },
};
