import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button } from "@/components/ui";
import { StudyEmpty } from "@/components/study/study-empty";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { StudyCard } from "./study-card";
import { StudySummary } from "./study-summary";
import { useStudySession } from "./use-study-session";
import type { DueCard } from "@/types/api";

/**
 * One study session, from the first prompt to the summary.
 *
 * `prompt` and `answer` come straight from the payload and are never derived
 * from front/back: the server has already resolved them for the deck's
 * direction, so re-deriving here would silently ignore a back-to-front deck.
 */

export type StudySessionProps = {
  cards: DueCard[];
  /** True when the queue came back full, so more cards are waiting. */
  queueWasFull: boolean;
  /** The deck's accent, when the session is scoped to one deck. */
  accent: string;
  /** Scopes the local due-count edit. Omitted for an all-decks session. */
  deckId?: number;
  /** No connection: the session still works, and the banner says why. */
  offline?: boolean;
  onFinish: () => void;
  onContinue: () => void;
};

export function StudySession({
  cards,
  queueWasFull,
  accent,
  deckId,
  offline = false,
  onFinish,
  onContinue,
}: StudySessionProps) {
  const { colors, space } = useTheme();
  const session = useStudySession(cards, deckId);
  const { state, currentCard } = session;

  useAnswerFeedback(state.feedback, session.clearFeedback);

  if (state.phase === "summary") {
    return (
      <>
        <Stack.Screen options={{ title: uz.study.summaryTitle }} />
        <StudySummary
          answers={state.answers}
          failedCount={state.failed.length}
          queueWasFull={queueWasFull}
          onRetryFailed={() => void session.retryFailed()}
          onFinish={onFinish}
          onContinue={onContinue}
        />
      </>
    );
  }

  if (!currentCard) {
    return (
      <Screen topInset={false}>
        <StudyEmpty />
      </Screen>
    );
  }

  const revealed = state.phase === "revealed";

  return (
    /* Two bands: the card taking every pixel it can, and the actions pinned to
       the bottom where the thumb already is. The progress counter is the
       header title rather than a row of its own - the word "Takrorlash" said
       nothing the user did not already know, and the row cost the card a line
       of height. */
    <>
      <Stack.Screen options={{ title: uz.study.progress(state.index + 1, state.queue.length) }} />
      <Screen topInset={false} contentStyle={{ flex: 1, gap: space.md, paddingVertical: space.md }}>
        <View style={{ flex: 1 }}>
          <StudyCard
            cardId={currentCard.id}
            prompt={currentCard.prompt}
            answer={currentCard.answer}
            revealed={revealed}
            onFlip={session.flip}
            accent={accent}
            onSwipe={session.answer}
          />
        </View>

        {/* Offline is the explanation; unsaved answers are the consequence.
            Showing both at once would say the same thing twice, so the
            offline notice wins while it applies. */}
        {offline ? (
          <Alert tone="info" message={uz.mobile.offlineStudyBody} />
        ) : state.failed.length > 0 ? (
          <Alert tone="warning" message={uz.study.unsavedAnswers(state.failed.length)} />
        ) : null}

        {revealed ? (
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label={uz.study.wrong}
                size="lg"
                block
                onPress={() => session.answer(false)}
                style={{ backgroundColor: colors.wrong, borderColor: colors.wrong }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={uz.study.correct}
                size="lg"
                block
                onPress={() => session.answer(true)}
                style={{ backgroundColor: colors.correct, borderColor: colors.correct }}
              />
            </View>
          </View>
        ) : (
          <Button label={uz.study.reveal} size="lg" block onPress={session.reveal} />
        )}
      </Screen>
    </>
  );
}

/**
 * Clearing the answer flash.
 *
 * The reducer sets `feedback` on every answer and nothing else resets it, so
 * without this the flag would stay set for the rest of the session.
 */
function useAnswerFeedback(
  feedback: ReturnType<typeof useStudySession>["state"]["feedback"],
  clear: () => void,
) {
  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(clear, 900);
    return () => clearTimeout(timer);
  }, [feedback, clear]);
}
