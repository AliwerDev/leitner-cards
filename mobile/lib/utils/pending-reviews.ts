import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "@/lib/api/error";
import { submitReview } from "@/lib/api/endpoints/reviews";

/**
 * A durable outbox for answers the server did not accept.
 *
 * WHY THIS EXISTS ON MOBILE AND NOT ON THE WEB. The web keeps failed writes in
 * component state (see the `failed` array in
 * frontend/src/components/study/use-study-session.ts) because a browser tab
 * surviving a network blip is the common case and closing one is a deliberate
 * act. A phone is different: the OS kills backgrounded apps without warning. A
 * user who answers twenty cards on the underground, switches apps, and has
 * this one reaped loses all twenty with no way to know it happened.
 *
 * THE TRADE, STATED HONESTLY. Replaying an answer is not perfectly idempotent:
 * it appends a second review_history row and re-applies the level transition,
 * so reviews_today can double-count. Losing an answer outright is worse than
 * counting one twice, so the outbox wins - but it is a trade, not a free win.
 *
 * WHAT IS NOT RETRIED. A 422 or a 404 will fail identically forever: the card
 * was deleted on another device, or the payload is malformed. Those are dropped
 * and reported, not retried until the end of time.
 */

export type PendingReview = {
  id: string;
  cardId: number;
  wasCorrect: boolean;
  /** Unix milliseconds, for the age cap. */
  at: number;
};

const KEY = "leitner-pending-reviews";

/** An outbox that grows without bound on a permanently broken account is its own bug. */
const MAX_ENTRIES = 500;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function readPending(): Promise<PendingReview[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - MAX_AGE_MS;
    return parsed.filter(
      (entry): entry is PendingReview =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as PendingReview).id === "string" &&
        typeof (entry as PendingReview).cardId === "number" &&
        typeof (entry as PendingReview).wasCorrect === "boolean" &&
        typeof (entry as PendingReview).at === "number" &&
        (entry as PendingReview).at > cutoff,
    );
  } catch {
    // Corrupt storage must not break the study screen. An unreadable outbox is
    // the same as an empty one from the UI's point of view.
    return [];
  }
}

async function write(entries: PendingReview[]): Promise<void> {
  try {
    // Keep the newest when over the cap: an old answer is the one most likely
    // to be superseded by a later review of the same card.
    const capped = entries.slice(-MAX_ENTRIES);
    await AsyncStorage.setItem(KEY, JSON.stringify(capped));
  } catch {
    // A failed write costs one answer; a thrown error costs the session.
  }
}

export async function addPending(cardId: number, wasCorrect: boolean): Promise<void> {
  const entries = await readPending();
  entries.push({ id: makeId(), cardId, wasCorrect, at: Date.now() });
  await write(entries);
}

export async function clearPending(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Nothing useful to do; the age cap will clear it eventually.
  }
}

export type FlushResult = {
  sent: number;
  /** Rejected permanently - the card is gone, or the payload is invalid. */
  dropped: number;
  /** Still queued: no connection, or the server is down. */
  remaining: number;
};

/**
 * Try to send everything in the outbox.
 *
 * Sequential rather than parallel on purpose: a queue that filled up offline
 * would otherwise fire fifty simultaneous requests the moment a connection
 * returns, and each POST /reviews takes a row lock on the card's progress.
 */
export async function flushPending(): Promise<FlushResult> {
  const entries = await readPending();
  if (entries.length === 0) return { sent: 0, dropped: 0, remaining: 0 };

  const stillPending: PendingReview[] = [];
  let sent = 0;
  let dropped = 0;

  for (const entry of entries) {
    try {
      await submitReview({ cardId: entry.cardId, wasCorrect: entry.wasCorrect });
      sent += 1;
    } catch (error) {
      const permanent =
        error instanceof ApiError &&
        (error.isValidation || error.isNotFound || error.isForbidden);

      if (permanent) {
        dropped += 1;
      } else {
        stillPending.push(entry);
      }
    }
  }

  await write(stillPending);
  return { sent, dropped, remaining: stillPending.length };
}
