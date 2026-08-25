import { useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { StudySession } from "@/components/study/study-session";
import { StudyEmpty } from "@/components/study/study-empty";
import { ErrorState, LoadingState } from "@/components/ui";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { ALL_DUE_CAP } from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { refreshAfterStudy } from "@/lib/query/refresh";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * Study across every deck.
 *
 * The route is outside (tabs), so the session fills the screen and the tab bar
 * is gone for its duration. The header back button is the way out.
 *
 * The queue is every card that is ready, fetched once per session.
 * `queueWasFull` is how the summary knows to offer "more cards left": the
 * server caps one response, so a queue that arrives at the cap has more behind
 * it, and `count` is the size of what came back rather than a true total.
 */
export default function StudyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { cards, count, sessionKey, nextQueue, awaitingNext, hasData, isRestoring, online, query } =
    useOfflineQueue();

  // Rendered by every branch, so the header and its back button are there
  // while the queue is still loading and when it comes back empty.
  const header = <Stack.Screen options={{ title: uz.study.title, gestureEnabled: false }} />;

  /*
   * The loading branch is "no data anywhere", not "a request is in flight".
   * Those diverged the moment the cache started surviving a cold start: a
   * request is always in flight here because the queue is staleTime 0, and
   * gating the session on it meant an offline user watched a spinner over a
   * queue that was on disk the whole time. isRestoring covers the few hundred
   * milliseconds before that disk read lands, so the screen does not flash
   * "no cards" and then fill in. awaitingNext is the same flash at the other
   * end of a session: the summary asked for another queue, and the one it just
   * worked through is already gone from the cache.
   */
  if (isRestoring || awaitingNext || (query.isPending && !hasData)) {
    return (
      <>
        {header}
        <LoadingState />
      </>
    );
  }

  /*
   * An error with data behind it is not an error the user needs to see. It is
   * almost always ApiError(0, "network"), and the answer to it is the session
   * plus its offline banner. ErrorState is reserved for a failed request with
   * nothing to study - the only case where the user genuinely cannot proceed.
   */
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

  const finish = () => {
    // The session edited the cache as it went, but those edits are a local
    // overlay - the queue, the badge, and every aggregate need the server now.
    // Leaving first, refreshing second: the refetches belong to the screen
    // behind this one, and nothing here waits on them.
    router.back();
    void refreshAfterStudy(queryClient);
  };

  return (
    <>
      {header}
      <StudySession
        // Remount only for a genuinely new queue, so the state machine starts
        // clean on "more cards left" and is never restarted under the user
        // mid-session. useOfflineQueue owns that distinction - the cached queue
        // shrinks on every answer and must not be read as a new one.
        key={sessionKey}
        cards={cards}
        queueWasFull={count >= ALL_DUE_CAP}
        offline={!online}
        accent={colors.accent}
        onFinish={finish}
        onContinue={() => void nextQueue()}
      />
    </>
  );
}
