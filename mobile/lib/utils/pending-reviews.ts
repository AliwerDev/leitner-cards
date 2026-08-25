import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "@/lib/api/error";
import { submitReviewBatch } from "@/lib/api/endpoints/reviews";

/**
 * A durable outbox for answers the server has not accepted yet.
 *
 * WHY THIS EXISTS ON MOBILE AND NOT ON THE WEB. The web keeps failed writes in
 * component state (see the `failed` array in
 * frontend/src/components/study/use-study-session.ts) because a browser tab
 * surviving a network blip is the common case and closing one is a deliberate
 * act. A phone is different: the OS kills backgrounded apps without warning. A
 * user who answers twenty cards on the underground, switches apps, and has
 * this one reaped loses all twenty with no way to know it happened.
 *
 * WHAT CHANGED. This file used to admit that replay was not idempotent - a
 * resent answer appended a second review_history row and double-counted
 * reviews_today. Every entry now carries a `clientId`, and the server has a
 * UNIQUE (user_id, client_id) index behind it, so a duplicate is recognised
 * and reported rather than applied twice. The old trade is gone.
 *
 * WHAT IS NOT RETRIED. A 422 or a 404 will fail identically forever: the card
 * was deleted on another device, or the payload is malformed. Those are
 * dropped and reported, not retried until the end of time.
 */

export type PendingReview = {
  /** Local array key. Not sent to the server. */
  id: string;
  /**
   * The idempotency token the server indexes.
   *
   * Distinct from `id` and load-bearing in a way it is not: this value must
   * never change once written, or a retry after a partial failure lands a
   * second copy of the same answer.
   */
  clientId: string;
  cardId: number;
  wasCorrect: boolean;
  /** Unix milliseconds - for the age cap, and for the server's reviewedAt. */
  at: number;
};

const KEY = "leitner-pending-reviews";

/** An outbox that grows without bound on a permanently broken account is its own bug. */
const MAX_ENTRIES = 500;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Mirrors ReviewController::MAX_BATCH. */
const BATCH_SIZE = 100;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Validate one stored entry, and backfill a clientId when it predates the
 * field.
 *
 * BACKFILL ON READ RATHER THAN A SCHEMA VERSION. A version field means a
 * migration step that has to run before anything can read the outbox, and a
 * failure there loses answers. Backfilling is idempotent, costs one string per
 * legacy entry, and cannot fail. The backfilled token is derived from the
 * entry's own `id`, which is already unique per enqueue, so a legacy entry
 * keeps a stable token across reads - if it did not, a retry after a crash
 * would look like a new answer and defeat the whole point.
 *
 * Everything else stays a field-by-field check for the reason it always was: a
 * corrupt entry must be dropped, not thrown, or the study screen dies on a bad
 * byte in AsyncStorage.
 */
function normalize(entry: unknown, cutoff: number): PendingReview | null {
  if (typeof entry !== "object" || entry === null) return null;

  const candidate = entry as Partial<PendingReview>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.cardId !== "number" ||
    typeof candidate.wasCorrect !== "boolean" ||
    typeof candidate.at !== "number" ||
    candidate.at <= cutoff
  ) {
    return null;
  }

  return {
    id: candidate.id,
    clientId:
      typeof candidate.clientId === "string" && candidate.clientId !== ""
        ? candidate.clientId
        : `legacy-${candidate.id}`,
    cardId: candidate.cardId,
    wasCorrect: candidate.wasCorrect,
    at: candidate.at,
  };
}

export async function readPending(): Promise<PendingReview[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - MAX_AGE_MS;

    return parsed
      .map((entry) => normalize(entry, cutoff))
      .filter((entry): entry is PendingReview => entry !== null);
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

/**
 * Record an answer, and hand back the entry that was written.
 *
 * WRITE FIRST, ALWAYS. The old code called this only once a POST had already
 * failed, which left a window: the app can be killed between the answer and
 * the failure, and the answer is gone with no trace it ever existed. The disk
 * write now happens before the request is attempted, so the worst case is a
 * duplicate submission - which the clientId makes free - rather than a lost
 * one.
 */
export async function enqueue(cardId: number, wasCorrect: boolean): Promise<PendingReview> {
  const entry: PendingReview = {
    id: makeId(),
    clientId: makeId(),
    cardId,
    wasCorrect,
    at: Date.now(),
  };

  const entries = await readPending();
  entries.push(entry);
  await write(entries);

  return entry;
}

/**
 * Remove entries the server has confirmed.
 *
 * Re-reads before writing rather than splicing a held array: a flush and a
 * live answer can both be in flight, and writing a stale array would resurrect
 * an entry the other had just cleared.
 */
export async function removePending(clientIds: readonly string[]): Promise<void> {
  if (clientIds.length === 0) return;

  const drop = new Set(clientIds);
  const entries = await readPending();

  await write(entries.filter((entry) => !drop.has(entry.clientId)));
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
 * One flush at a time, process-wide - and every caller gets its result.
 *
 * usePendingFlush mounts in several places (the root, so syncing is not
 * limited to one tab, plus the screens that display a count), and each hook
 * has its own re-entry ref, so the guard has to live below all of them or two
 * mounts send the same batch twice.
 *
 * WHY A SHARED PROMISE RATHER THAN A BOOLEAN. A boolean turned the loser away
 * with `sent: 0`, which broke the summary's retry button: reconnecting fires a
 * background flush, the user taps retry a moment later, and the tap was
 * reported as "nothing sent, still pending" even though the flush it collided
 * with went on to send everything. Joining the in-flight promise means the
 * second caller waits for the real answer instead of a fabricated one.
 */
let inFlight: Promise<FlushResult> | null = null;

/**
 * Try to send everything in the outbox.
 *
 * Chunked and sequential, not parallel. The old code sent one request per
 * answer for the same reason it was sequential: each POST /reviews takes a row
 * lock on the card's progress, and a queue filled up offline would otherwise
 * fire fifty simultaneous requests the moment a connection returned. A batch
 * collapses fifty requests into one, but the chunks still go one after another
 * - both for that reason and because a batch is applied in order.
 *
 * ORDER IS LOAD-BEARING. Two answers to the same card must reach the server
 * oldest-first or the ladder lands wrong: correct-then-wrong leaves the card
 * at level 1, wrong-then-correct at level 2. The outbox is append-ordered, so
 * slicing it in order preserves that, and the server sorts by reviewedAt as
 * well - neither side relies on the other to get it right.
 */
export function flushPending(): Promise<FlushResult> {
  // Join the flush already running rather than starting a second one or
  // reporting a result that did not happen.
  inFlight ??= runFlush().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function runFlush(): Promise<FlushResult> {
  const entries = await readPending();
  if (entries.length === 0) return { sent: 0, dropped: 0, remaining: 0 };

  const settled = new Set<string>();
  let sent = 0;
  let dropped = 0;

  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const chunk = entries.slice(start, start + BATCH_SIZE);

    try {
      const response = await submitReviewBatch(
        chunk.map((entry) => ({
          cardId: entry.cardId,
          wasCorrect: entry.wasCorrect,
          // Seconds: the backend stores every timestamp as a second integer.
          reviewedAt: Math.floor(entry.at / 1000),
          clientId: entry.clientId,
        })),
      );

      for (const result of response.results) {
        if (result.clientId === null) continue;

        if (result.status === "applied" || result.status === "duplicate") {
          settled.add(result.clientId);
          sent += 1;
        } else if (result.status === "rejected") {
          settled.add(result.clientId);
          dropped += 1;
        }
        // "failed" is left in the outbox for the next attempt.
      }
    } catch (error) {
      const permanent =
        error instanceof ApiError &&
        (error.isValidation || error.isNotFound || error.isForbidden);

      if (permanent) {
        // The whole chunk was rejected at the envelope level - an oversize
        // batch, or a body the server could not parse. Resending it unchanged
        // cannot work, so drop it rather than wedge the outbox behind it
        // forever.
        for (const entry of chunk) {
          settled.add(entry.clientId);
          dropped += 1;
        }
        continue;
      }

      /*
       * No connection, or the server is down. Stop rather than grind through
       * the remaining chunks: every one of them fails the same way, and the
       * later chunks hold the newer answers, which must not reach the server
       * before the earlier ones if the connection recovers mid-loop.
       */
      break;
    }
  }

  await removePending([...settled]);

  return { sent, dropped, remaining: entries.length - settled.size };
}
