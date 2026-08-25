import { router, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { DeckCard } from "@/components/decks/deck-card";
import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Text,
} from "@/components/ui";
import { useDeckCounts, useDecks } from "@/hooks/use-decks";
import { usePrefetchDueQueue } from "@/hooks/use-due";
import { usePendingFlush } from "@/hooks/use-pending-flush";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/session-context";
import { canCreateDeck, decksLabel, deckLimitMessage } from "@/lib/domain/quota";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

export default function DecksScreen() {
  const { colors, space } = useTheme();
  const { quota } = useAuth();
  const navigation = useRouter();
  const { data, isPending, error, refetch, isRefetching } = useDecks();

  // Hooks cannot sit behind the early returns below, so the counts are
  // requested with whatever the list currently holds.
  const { counts, refetch: refetchCounts } = useDeckCounts((data ?? []).map((deck) => deck.id));

  // This screen is where a user stands before they tap Study, and it is
  // normally online when they do. Warming the queue here is what puts it on
  // disk in time for a session started underground.
  usePrefetchDueQueue();

  // The count only; the flush itself is driven from the root layout.
  const { count: pendingCount, flushing, flush } = usePendingFlush();

  // A pull refreshes the list AND every card's numbers. The counts are a
  // separate query per deck, so refetching the list alone would update the
  // names and leave the due badges stale.
  const refreshAll = useCallback(
    () => Promise.all([refetch(), refetchCounts()]),
    [refetch, refetchCounts],
  );

  const openDeck = useCallback((id: number) => navigation.push(`/decks/${id}`), [navigation]);

  const studyDeck = useCallback((id: number) => navigation.push(`/study/${id}`), [navigation]);

  // Without a quota (the offline state) the button stays enabled and the
  // server decides. Disabling it on missing data would block a user who is
  // simply not connected yet.
  const canCreate = quota === null || canCreateDeck(quota);

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

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(deck) => String(deck.id)}
        contentContainerStyle={{
          padding: space.md,
          gap: space.sm,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refreshAll()} />
        }
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space["2xs"] }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text variant="title">{uz.deck.title}</Text>

              {/* The quota reading and the create action, in that order: the
                  number explains whether the button will work. */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                {quota ? (
                  <Text variant="caption" tone="subtle">
                    {decksLabel(quota)}
                  </Text>
                ) : null}
                {canCreate ? (
                  <IconButton
                    icon={<Plus color={colors.textOnAccent} size={20} strokeWidth={2.25} />}
                    label={uz.deck.create}
                    size="sm"
                    onPress={() => router.push("/deck-form")}
                  />
                ) : null}
              </View>
            </View>

            {quota && !canCreateDeck(quota) ? (
              <Alert tone="warning" message={deckLimitMessage(quota)} />
            ) : null}

            {/* Where a user lands when they come back online, so it is where
                the outbox reports itself. Tapping retries immediately rather
                than waiting for the next AppState or connectivity event. */}
            {pendingCount > 0 ? (
              <Alert
                tone="info"
                message={
                  flushing ? uz.mobile.pendingSending : uz.mobile.syncPending(pendingCount)
                }
                action={
                  flushing ? undefined : (
                    <Button
                      label={uz.mobile.retry}
                      variant="outline"
                      size="sm"
                      onPress={() => void flush()}
                    />
                  )
                }
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={uz.deck.empty}
            body={uz.deck.emptyHint}
            actionLabel={canCreate ? uz.deck.create : undefined}
            onAction={canCreate ? () => router.push("/deck-form") : undefined}
          />
        }
        renderItem={({ item }) => (
          <DeckCard
            deck={item}
            counts={counts[item.id]}
            onPress={() => openDeck(item.id)}
            onStudy={() => studyDeck(item.id)}
          />
        )}
      />
    </Screen>
  );
}
