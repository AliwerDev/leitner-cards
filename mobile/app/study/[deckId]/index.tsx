import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { StudySession } from "@/components/study/study-session";
import { queueKey } from "@/components/study/queue-key";
import { StudyEmpty } from "@/components/study/study-empty";
import { ErrorState, LoadingState } from "@/components/ui";
import { useDeck } from "@/hooks/use-decks";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { ALL_DUE_CAP } from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { deckAccent } from "@/lib/domain/deck-color";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { qk, qkPrefix } from "@/lib/query/keys";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * A session scoped to one deck, carrying that deck's color.
 *
 * The route is /study/[deckId], outside (tabs), so the session fills the
 * screen and the tab bar is gone for its duration.
 */
export default function DeckStudyScreen() {
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = Number(params.deckId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, resolved } = useTheme();

  const deckQuery = useDeck(deckId);
  const { cards, count, hasData, isRestoring, online, query } = useOfflineQueue(deckId);

  // Rendered by every branch below, so the header and its back button are
  // there while the queue is still loading and when it comes back empty. Once
  // cards are up the session overrides this title with its own progress
  // counter, so this is only ever the pre-session fallback.
  const header = <Stack.Screen options={{ title: uz.study.title, gestureEnabled: false }} />;

  /*
   * "No data anywhere" rather than "a request is in flight" - see the same
   * branch in app/study/index.tsx for why the two had to be separated.
   */
  if (isRestoring || (query.isPending && !hasData)) {
    return (
      <>
        {header}
        <LoadingState />
      </>
    );
  }

  // A failed request with a stored queue behind it is handled by the session's
  // offline banner, not by taking the screen away.
  if (query.error && !hasData) {
    return (
      <>
        {header}
        <Screen topInset={false}>
          <ErrorState
            message={
              query.error instanceof ApiError
                ? apiErrorMessage(query.error)
                : uz.errors.unexpected
            }
            onRetry={() => void query.refetch()}
            retryLabel={uz.common.retry}
          />
        </Screen>
      </>
    );
  }

  if (cards.length === 0) {
    return (
      <>
        {header}
        <Screen topInset={false}>
          <StudyEmpty />
        </Screen>
      </>
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
      {header}
      <StudySession
        key={queueKey(cards)}
        cards={cards}
        queueWasFull={count >= ALL_DUE_CAP}
        deckId={deckId}
        offline={!online}
        accent={accent}
        onFinish={finish}
        onContinue={() => void query.refetch()}
      />
    </>
  );
}
