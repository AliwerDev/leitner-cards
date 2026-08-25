// PORTED FROM frontend/src/components/study/use-study-session.ts
//
// The reducer is unchanged - it has no DOM dependency, and the reasoning in the
// original header comment holds even harder on a phone. Two changes:
//
//   1. The web calls a server action; here it is a direct API call, and the
//      returned due_count is written into the query cache so the tab badge
//      stays live without a request per answer.
//   2. EVERY answer is appended to a durable outbox before it is sent, because
//      the OS can kill this app between an answer and its response. See
//      lib/utils/pending-reviews.ts.
//   3. The cached queue and the badge are edited locally as answers are given,
//      which is what makes a session work with no network at all. See
//      lib/query/offline-queue.ts.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useReducer } from "react";
import { submitReview } from "@/lib/api/endpoints/reviews";
import { nextLevel } from "@/lib/domain/level";
import { decrementCachedDueCount, removeFromCachedQueues } from "@/lib/query/offline-queue";
import { qk } from "@/lib/query/keys";
import {
  enqueue,
  flushPending,
  readPending,
  removePending,
  type PendingReview,
} from "@/lib/utils/pending-reviews";
import type { CardLevel, DueCard } from "@/types/api";

/**
 * The study session state machine.
 *
 * The queue is fetched once and then lives entirely in local state. Answers
 * post in the background: the UI advances immediately, because at this cadence
 * a round trip between "I pressed correct" and "next card" is felt. A failed
 * write is queued for retry and never rolls back the visible progress - losing
 * the user's place over a network blip is worse than a delayed write.
 */

export type Phase = "prompt" | "revealed" | "summary";

export type AnswerRecord = {
  card: DueCard;
  wasCorrect: boolean;
  levelBefore: CardLevel;
  levelAfter: CardLevel;
};

export type Feedback = {
  levelBefore: CardLevel;
  levelAfter: CardLevel;
  wasCorrect: boolean;
  mastered: boolean;
};

export type StudyState = {
  queue: DueCard[];
  index: number;
  phase: Phase;
  answers: AnswerRecord[];
  /** Answers the server rejected, kept so the summary can offer a retry. */
  failed: { cardId: number; wasCorrect: boolean }[];
  feedback: Feedback | null;
};

type Action =
  | { type: "reveal" }
  | { type: "flip" }
  | { type: "answer"; wasCorrect: boolean }
  | { type: "clearFeedback" }
  | { type: "recordFailure"; cardId: number; wasCorrect: boolean }
  | { type: "clearFailures" }
  | { type: "restart"; queue: DueCard[] };

function currentLevel(card: DueCard): CardLevel {
  return card.progress.current_level;
}

function reducer(state: StudyState, action: Action): StudyState {
  switch (action.type) {
    case "reveal":
      return state.phase === "prompt" ? { ...state, phase: "revealed" } : state;

    // Unlike reveal, a tap on the card turns it back over as well.
    case "flip":
      if (state.phase === "prompt") return { ...state, phase: "revealed" };
      if (state.phase === "revealed") return { ...state, phase: "prompt" };
      return state;

    case "answer": {
      const card = state.queue[state.index];
      if (!card) return state;

      const levelBefore = currentLevel(card);
      const levelAfter = nextLevel(levelBefore, action.wasCorrect);
      const isLast = state.index >= state.queue.length - 1;

      return {
        ...state,
        index: state.index + 1,
        phase: isLast ? "summary" : "prompt",
        answers: [
          ...state.answers,
          { card, wasCorrect: action.wasCorrect, levelBefore, levelAfter },
        ],
        feedback: {
          levelBefore,
          levelAfter,
          wasCorrect: action.wasCorrect,
          mastered: action.wasCorrect && levelAfter === 8,
        },
      };
    }

    case "clearFeedback":
      return { ...state, feedback: null };

    case "recordFailure":
      return {
        ...state,
        failed: [...state.failed, { cardId: action.cardId, wasCorrect: action.wasCorrect }],
      };

    case "clearFailures":
      return { ...state, failed: [] };

    case "restart":
      return {
        queue: action.queue,
        index: 0,
        phase: action.queue.length === 0 ? "summary" : "prompt",
        answers: [],
        failed: [],
        feedback: null,
      };
  }
}

/**
 * `deckId` is only used to decrement the deck-scoped due count alongside the
 * account-wide one. Omitted for an all-decks session, where there is no
 * deck-scoped key to keep current.
 */
export function useStudySession(initialQueue: DueCard[], deckId?: number) {
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(reducer, {
    queue: initialQueue,
    index: 0,
    phase: initialQueue.length === 0 ? "summary" : "prompt",
    answers: [],
    failed: [],
    feedback: null,
  });

  const reveal = useCallback(() => dispatch({ type: "reveal" }), []);

  const flip = useCallback(() => dispatch({ type: "flip" }), []);

  /**
   * Post one answer, keeping the badge current from the response.
   *
   * POST /reviews already returns the account-wide due_count, so writing it
   * into the cache keeps the Study tab live at no request cost. Invalidating
   * instead would fire a request per answer.
   *
   * The clientId comes from the outbox entry written a moment earlier, so this
   * request and any later retry of it are the same answer as far as the server
   * is concerned. Without it, a slow response followed by a background flush
   * writes the review twice.
   */
  const post = useCallback(
    async (entry: PendingReview): Promise<boolean> => {
      try {
        const result = await submitReview({
          cardId: entry.cardId,
          wasCorrect: entry.wasCorrect,
          reviewedAt: Math.floor(entry.at / 1000),
          clientId: entry.clientId,
        });
        queryClient.setQueryData(qk.dueCount(undefined), { due_count: result.due_count });
        return true;
      } catch {
        return false;
      }
    },
    [queryClient],
  );

  const answer = useCallback(
    (wasCorrect: boolean) => {
      const card = state.queue[state.index];
      if (!card || state.phase !== "revealed") return;

      // Advance first; the write follows.
      dispatch({ type: "answer", wasCorrect });

      /*
       * Edit the cache immediately and unconditionally, before the request is
       * even attempted. Offline these are the only thing keeping the badge and
       * the stored queue honest; online they are overwritten by the
       * authoritative due_count a moment later, so there is nothing to undo.
       */
      removeFromCachedQueues(queryClient, card.id);
      decrementCachedDueCount(queryClient, deckId);

      /*
       * Enqueue, send, then dequeue on success. The old code sent first and
       * only enqueued on failure, which lost the answer when the OS killed the
       * app inside the request. The cost of this order is one disk write per
       * answer; the benefit is that no window exists in which an answered card
       * lives only in memory.
       */
      void enqueue(card.id, wasCorrect).then(async (entry) => {
        if (await post(entry)) {
          await removePending([entry.clientId]);
        } else {
          dispatch({ type: "recordFailure", cardId: card.id, wasCorrect });
        }
      });
    },
    [state.queue, state.index, state.phase, post, queryClient, deckId],
  );

  /**
   * The summary's retry button.
   *
   * Drains the outbox rather than resending from `failed`: the outbox is the
   * durable copy and `failed` is only what this session happens to remember.
   * Everything in `failed` is in the outbox by construction now, and keeping
   * two retry paths is how they drift apart.
   *
   * WHAT COUNTS AS SUCCESS. The outbox being empty afterwards is the wrong
   * test, and it made this button look broken twice over: a flush already
   * running when the user tapped used to report `sent: 0` (fixed in
   * flushPending, which now shares its promise), and an entry belonging to
   * some other session would keep `remaining` above zero forever. What this
   * button owns is THIS session's failures, so it re-reads the outbox and
   * clears the ones that are no longer in it.
   */
  const retryFailed = useCallback(async () => {
    if (state.failed.length === 0) return;

    await flushPending();

    const stillQueued = new Set((await readPending()).map((entry) => entry.cardId));
    if (!state.failed.some((item) => stillQueued.has(item.cardId))) {
      dispatch({ type: "clearFailures" });
    }
  }, [state.failed]);

  const clearFeedback = useCallback(() => dispatch({ type: "clearFeedback" }), []);

  const restart = useCallback((queue: DueCard[]) => dispatch({ type: "restart", queue }), []);

  const currentCard = state.queue[state.index];
  const correctCount = state.answers.filter((a) => a.wasCorrect).length;

  return {
    state,
    currentCard,
    correctCount,
    wrongCount: state.answers.length - correctCount,
    masteredCount: state.answers.filter((a) => a.wasCorrect && a.levelAfter === 8).length,
    reveal,
    flip,
    answer,
    retryFailed,
    clearFeedback,
    restart,
  };
}
