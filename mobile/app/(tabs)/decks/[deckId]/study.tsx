import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { StudySession } from "@/components/study/study-session";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useDeck } from "@/hooks/use-decks";
import { useDueCards } from "@/hooks/use-due";
import { DEFAULT_DUE_LIMIT } from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { deckAccent } from "@/lib/domain/deck-color";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { qk, qkPrefix } from "@/lib/query/keys";
import { useTheme } from "@/lib/theme/theme-context";

/** A session scoped to one deck, carrying that deck's color. */
export default function DeckStudyScreen() {
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = Number(params.deckId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, resolved } = useTheme();

  const deckQuery = useDeck(deckId);
  const dueQuery = useDueCards(deckId, DEFAULT_DUE_LIMIT);

  if (dueQuery.isPending) return <LoadingState />;

  if (dueQuery.error) {
    return (
      <Screen>
        <ErrorState
          message={
            dueQuery.error instanceof ApiError
              ? apiErrorMessage(dueQuery.error)
              : uz.errors.unexpected
          }
          onRetry={() => void dueQuery.refetch()}
          retryLabel={uz.common.retry}
        />
      </Screen>
    );
  }

  if (dueQuery.data.cards.length === 0) {
    return (
      <Screen>
        <EmptyState title={uz.study.empty} body={uz.study.emptyHint} />
      </Screen>
    );
  }

  const deck = deckQuery.data;
  const accent = deck ? deckAccent(deck.color, deck.id, resolved) : colors.accent;

  const finish = () => {
    void queryClient.invalidateQueries({ queryKey: qkPrefix.due });
    void queryClient.invalidateQueries({ queryKey: qkPrefix.stats });
    void queryClient.invalidateQueries({ queryKey: qk.deckStats(deckId) });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: uz.study.title, gestureEnabled: false }} />
      <StudySession
        key={dueQuery.data.cards.map((card) => card.id).join("-")}
        cards={dueQuery.data.cards}
        queueWasFull={dueQuery.data.cards.length >= DEFAULT_DUE_LIMIT}
        accent={accent}
        onFinish={finish}
        onContinue={() => void dueQuery.refetch()}
      />
    </>
  );
}
