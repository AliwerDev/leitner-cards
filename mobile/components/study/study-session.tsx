import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, EmptyState, Text } from "@/components/ui";
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
  onFinish: () => void;
  onContinue: () => void;
};

export function StudySession({
  cards,
  queueWasFull,
  accent,
  onFinish,
  onContinue,
}: StudySessionProps) {
  const { colors, space } = useTheme();
  const session = useStudySession(cards);
  const { state, currentCard } = session;

  useAnswerFeedback(state.feedback, session.clearFeedback);

  if (state.phase === "summary") {
    return (
      <StudySummary
        answers={state.answers}
        failedCount={state.failed.length}
        queueWasFull={queueWasFull}
        onRetryFailed={() => void session.retryFailed()}
        onFinish={onFinish}
        onContinue={onContinue}
      />
    );
  }

  if (!currentCard) {
    return (
      <Screen>
        <EmptyState title={uz.study.empty} body={uz.study.emptyHint} />
      </Screen>
    );
  }

  const revealed = state.phase === "revealed";

  return (
    <Screen contentStyle={{ flex: 1, justifyContent: "center", gap: space.lg }}>
      <View style={{ alignItems: "center" }}>
        <Text variant="caption" tone="subtle">
          {uz.study.progress(state.index + 1, state.queue.length)}
        </Text>
      </View>

      <StudyCard
        prompt={currentCard.prompt}
        answer={currentCard.answer}
        revealed={revealed}
        onFlip={session.flip}
        accent={accent}
      />

      {state.failed.length > 0 ? (
        <Alert tone="warning" message={uz.study.unsavedAnswers(state.failed.length)} />
      ) : null}

      {revealed ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={uz.study.wrong}
              variant="outline"
              size="lg"
              block
              onPress={() => session.answer(false)}
              style={{ borderColor: colors.wrong }}
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
  );
}

/**
 * The haptic tick on an answer, and clearing the flash afterwards.
 *
 * This is the affordance the web genuinely cannot have, and it is what makes
 * an answer feel registered without waiting for the network - which is exactly
 * what the optimistic advance is trading on.
 */
function useAnswerFeedback(
  feedback: ReturnType<typeof useStudySession>["state"]["feedback"],
  clear: () => void,
) {
  useEffect(() => {
    if (!feedback) return;

    if (feedback.mastered) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const timer = setTimeout(clear, 900);
    return () => clearTimeout(timer);
  }, [feedback, clear]);
}
