"use client";

import { useCallback, useReducer } from "react";
import { submitReviewAction } from "@/lib/actions/reviews";
import { nextLevel } from "@/lib/domain/level";
import type { CardLevel, DueCard } from "@/types/api";

/**
 * The study session state machine.
 *
 * The queue is fetched once on the server and then lives entirely in client
 * state. Answers post in the background: the UI advances immediately, because
 * at this cadence a round trip between "I pressed correct" and "next card" is
 * felt. A failed write is queued for retry and never rolls back the visible
 * progress - losing the user's place over a network blip is worse than a
 * delayed write.
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

  const answer = useCallback(
    (wasCorrect: boolean) => {
      const card = state.queue[state.index];
      if (!card || state.phase !== "revealed") return;

      // Advance first; the write follows.
      dispatch({ type: "answer", wasCorrect });

      void submitReviewAction(card.id, wasCorrect).then((result) => {
        if (!result.ok) {
          dispatch({ type: "recordFailure", cardId: card.id, wasCorrect });
        }
      });
    },
    [state.queue, state.index, state.phase],
  );

  const retryFailed = useCallback(async () => {
    const pending = state.failed;
    if (pending.length === 0) return;

    dispatch({ type: "clearFailures" });

    const results = await Promise.all(
      pending.map(async (item) => ({
        item,
        result: await submitReviewAction(item.cardId, item.wasCorrect),
      })),
    );

    for (const { item, result } of results) {
      if (!result.ok) {
        dispatch({ type: "recordFailure", cardId: item.cardId, wasCorrect: item.wasCorrect });
      }
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
