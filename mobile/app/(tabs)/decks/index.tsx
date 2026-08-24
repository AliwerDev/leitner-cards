import { router, useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { DeckCard } from "@/components/decks/deck-card";
import { Alert, Button, EmptyState, ErrorState, LoadingState, Text } from "@/components/ui";
import { useDecks } from "@/hooks/use-decks";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/session-context";
import { canCreateDeck, decksLabel, deckLimitMessage } from "@/lib/domain/quota";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

export default function DecksScreen() {
  const { space } = useTheme();
  const { quota } = useAuth();
  const navigation = useRouter();
  const { data, isPending, error, refetch, isRefetching } = useDecks();

  const openDeck = useCallback(
    (id: number) => navigation.push(`/decks/${id}`),
    [navigation],
  );

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
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
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
              {quota ? (
                <Text variant="caption" tone="subtle">
                  {decksLabel(quota)}
                </Text>
              ) : null}
            </View>

            {quota && !canCreateDeck(quota) ? (
              <Alert tone="warning" message={deckLimitMessage(quota)} />
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
        renderItem={({ item }) => <DeckCard deck={item} onPress={() => openDeck(item.id)} />}
      />

      {data && data.length > 0 && canCreate ? (
        <View style={{ padding: space.md, paddingTop: 0 }}>
          <Button label={uz.deck.create} block onPress={() => router.push("/deck-form")} />
        </View>
      ) : null}
    </Screen>
  );
}
