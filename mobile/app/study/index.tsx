import { useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { StudySession } from "@/components/study/study-session";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useDueCards } from "@/hooks/use-due";
import { DEFAULT_DUE_LIMIT } from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { qkPrefix } from "@/lib/query/keys";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * Study across every deck.
 *
 * The route is outside (tabs), so the session fills the screen and the tab bar
 * is gone for its duration. The header back button is the way out.
 *
 * The queue is fetched once per session. `queueWasFull` is how the summary
 * knows to offer "more cards left": the endpoint clamps to `limit`, so a full
 * page means there is more behind it, and `count` in the response is the size
 * of this page rather than a total.
 */
export default function StudyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { data, isPending, error, refetch } = useDueCards(undefined, DEFAULT_DUE_LIMIT);

  // Rendered by every branch, so the header and its back button are there
  // while the queue is still loading and when it comes back empty.
  const header = <Stack.Screen options={{ title: uz.study.title, gestureEnabled: false }} />;

  if (isPending) {
    return (
      <>
        {header}
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <Screen topInset={false}>
          <ErrorState
            message={error instanceof ApiError ? apiErrorMessage(error) : uz.errors.unexpected}
            onRetry={() => void refetch()}
            retryLabel={uz.common.retry}
          />
        </Screen>
      </>
    );
  }

  if (data.cards.length === 0) {
    return (
      <>
        {header}
        <Screen topInset={false}>
          <EmptyState title={uz.study.empty} body={uz.study.emptyHint} />
        </Screen>
      </>
    );
  }

  const finish = () => {
    // The session wrote due_count into the cache as it went, but the queue and
    // every aggregate are now stale.
    void queryClient.invalidateQueries({ queryKey: qkPrefix.due });
    void queryClient.invalidateQueries({ queryKey: qkPrefix.stats });
    router.back();
  };

  return (
    <>
      {header}
      <StudySession
        // Remount on a new queue so the state machine starts clean rather than
        // resuming at a stale index.
        key={data.cards.map((card) => card.id).join("-")}
        cards={data.cards}
        queueWasFull={data.cards.length >= DEFAULT_DUE_LIMIT}
        accent={colors.accent}
        onFinish={finish}
        onContinue={() => void refetch()}
      />
    </>
  );
}
