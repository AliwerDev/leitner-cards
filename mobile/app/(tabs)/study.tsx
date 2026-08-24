import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/layout/screen";
import { StudySession } from "@/components/study/study-session";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useDueCards } from "@/hooks/use-due";
import { ApiError } from "@/lib/api/error";
import { DEFAULT_DUE_LIMIT } from "@/lib/api/endpoints/reviews";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { qkPrefix } from "@/lib/query/keys";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * Study across every deck.
 *
 * The queue is fetched once per session. `queueWasFull` is how the summary
 * knows to offer "more cards left": the endpoint clamps to `limit`, so a full
 * page means there is more behind it, and `count` in the response is the size
 * of this page rather than a total.
 */
export default function StudyTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { data, isPending, error, refetch } = useDueCards(undefined, DEFAULT_DUE_LIMIT);

  if (isPending) return <LoadingState />;

  if (error) {
    return (
      <Screen>
        <ErrorState
          message={error instanceof ApiError ? apiErrorMessage(error) : uz.errors.unexpected}
          onRetry={() => void refetch()}
          retryLabel={uz.common.retry}
        />
      </Screen>
    );
  }

  if (data.cards.length === 0) {
    return (
      <Screen>
        <EmptyState title={uz.study.empty} body={uz.study.emptyHint} />
      </Screen>
    );
  }

  const finish = () => {
    // The session wrote due_count into the cache as it went, but the queue and
    // every aggregate are now stale.
    void queryClient.invalidateQueries({ queryKey: qkPrefix.due });
    void queryClient.invalidateQueries({ queryKey: qkPrefix.stats });
    router.push("/decks");
  };

  return (
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
  );
}
