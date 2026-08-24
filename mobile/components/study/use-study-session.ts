// PORTED FROM frontend/src/components/study/use-study-session.ts
//
// The reducer is unchanged - it has no DOM dependency, and the reasoning in the
// original header comment holds even harder on a phone. Two changes:
//
//   1. The web calls a server action; here it is a direct API call, and the
//      returned due_count is written into the query cache so the tab badge
//      stays live without a request per answer.
//   2. A failed write is ALSO appended to a durable outbox, because the OS can
//      kill this app between an answer and its retry. See
//      lib/utils/pending-reviews.ts for that trade.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useReducer } from "react";
import { submitReview } from "@/lib/api/endpoints/reviews";
import { nextLevel } from "@/lib/domain/level";
import { qk } from "@/lib/query/keys";
import { addPending } from "@/lib/utils/pending-reviews";
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

export function useStudySession(initialQueue: DueCard[]) {
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
   */
  const post = useCallback(
    async (cardId: number, wasCorrect: boolean): Promise<boolean> => {
      try {
        const result = await submitReview({ cardId, wasCorrect });
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

      void post(card.id, wasCorrect).then((ok) => {
        if (!ok) {
          dispatch({ type: "recordFailure", cardId: card.id, wasCorrect });
          // Also persist, so the answer survives the app being killed.
          void addPending(card.id, wasCorrect);
        }
      });
    },
    [state.queue, state.index, state.phase, post],
  );

  const retryFailed = useCallback(async () => {
    const pending = state.failed;
    if (pending.length === 0) return;

    dispatch({ type: "clearFailures" });

    const results = await Promise.all(
      pending.map(async (item) => ({ item, ok: await post(item.cardId, item.wasCorrect) })),
    );

    for (const { item, ok } of results) {
      if (!ok) {
        dispatch({ type: "recordFailure", cardId: item.cardId, wasCorrect: item.wasCorrect });
      }
    }
  }, [state.failed, post]);

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
