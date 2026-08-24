import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert as RNAlert, FlatList, Pressable, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Card, EmptyState, ErrorState, Input, LoadingState, Text } from "@/components/ui";
import { useCardCount, useCards, useDeleteCard } from "@/hooks/use-cards";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDeckStats, useDeleteDeck } from "@/hooks/use-decks";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/session-context";
import { deckAccent } from "@/lib/domain/deck-color";
import { cardsLabel, isDeckFull } from "@/lib/domain/quota";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { DeckAccentProvider, useTheme } from "@/lib/theme/theme-context";

/**
 * One deck: its numbers, then its cards.
 *
 * The whole screen is wrapped in DeckAccentProvider, so every accent inside -
 * the buttons, the level bars - takes the deck's color. That is the React
 * Native equivalent of the web re-pointing --color-accent for a subtree.
 */
export default function DeckDetailScreen() {
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = Number(params.deckId);
  const { resolved } = useTheme();

  const statsQuery = useDeckStats(deckId);

  if (Number.isNaN(deckId)) {
    return (
      <Screen>
        <ErrorState message={uz.errors.notFound} retryLabel={uz.common.retry} />
      </Screen>
    );
  }

  if (statsQuery.isPending) return <LoadingState />;

  if (statsQuery.error) {
    return (
      <Screen>
        <ErrorState
          message={
            statsQuery.error instanceof ApiError
              ? apiErrorMessage(statsQuery.error)
              : uz.errors.unexpected
          }
          onRetry={() => void statsQuery.refetch()}
          retryLabel={uz.common.retry}
        />
      </Screen>
    );
  }

  const { deck, stats } = statsQuery.data;
  const accent = deckAccent(deck.color, deck.id, resolved);

  return (
    <DeckAccentProvider accent={accent}>
      <Stack.Screen options={{ title: deck.name }} />
      <DeckBody deckId={deckId} deckName={deck.name} dueNow={stats.due_now} total={stats.total_cards} />
    </DeckAccentProvider>
  );
}

function DeckBody({
  deckId,
  deckName,
  dueNow,
  total,
}: {
  deckId: number;
  deckName: string;
  dueNow: number;
  total: number;
}) {
  const router = useRouter();
  const { space } = useTheme();
  const { quota } = useAuth();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const cardsQuery = useCards(deckId, debouncedSearch, page);
  const countQuery = useCardCount(deckId);
  const deleteCard = useDeleteCard(deckId);
  const deleteDeck = useDeleteDeck();

  const cardCount = countQuery.data ?? total;
  const full = quota ? isDeckFull(cardCount, quota) : false;

  const confirmDeleteCard = (id: number) => {
    RNAlert.alert(uz.card.deleteTitle, uz.card.deleteConfirm, [
      { text: uz.common.cancel, style: "cancel" },
      {
        text: uz.common.delete,
        style: "destructive",
        onPress: () => deleteCard.mutate(id),
      },
    ]);
  };

  const confirmDeleteDeck = () => {
    RNAlert.alert(uz.deck.deleteTitle, uz.deck.deleteConfirm(deckName), [
      { text: uz.common.cancel, style: "cancel" },
      {
        text: uz.common.delete,
        style: "destructive",
        onPress: () =>
          deleteDeck.mutate(deckId, {
            onSuccess: () => router.back(),
          }),
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={cardsQuery.data?.items ?? []}
        keyExtractor={(card) => String(card.id)}
        contentContainerStyle={{ padding: space.md, gap: space.sm, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", gap: space.xs }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={dueNow > 0 ? uz.deck.dueCount(dueNow) : uz.deck.noDue}
                  block
                  disabled={dueNow === 0}
                  onPress={() => router.push(`/decks/${deckId}/study`)}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: space.xs }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={uz.card.create}
                  variant="outline"
                  size="sm"
                  block
                  disabled={full}
                  onPress={() => router.push(`/card-form?deckId=${deckId}`)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={uz.card.bulkCreate}
                  variant="outline"
                  size="sm"
                  block
                  disabled={full}
                  onPress={() => router.push(`/bulk-add?deckId=${deckId}`)}
                />
              </View>
            </View>

            {full && quota ? (
              <Alert tone="warning" message={cardsLabel(cardCount, quota)} />
            ) : null}

            <Input
              placeholder={uz.card.searchPlaceholder}
              value={search}
              onChangeText={(next) => {
                setSearch(next);
                // A new search invalidates the current page number.
                setPage(1);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        }
        ListEmptyComponent={
          cardsQuery.isPending ? (
            <LoadingState />
          ) : (
            <EmptyState
              title={debouncedSearch ? uz.card.searchEmpty : uz.card.empty}
              body={debouncedSearch ? undefined : uz.card.emptyHint}
            />
          )
        }
        renderItem={({ item }) => (
          <Card>
            <Pressable
              onLongPress={() => confirmDeleteCard(item.id)}
              onPress={() => router.push(`/card-form?deckId=${deckId}&cardId=${item.id}`)}
            >
              <View style={{ gap: space["3xs"] }}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {item.front}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={2}>
                  {item.back}
                </Text>
              </View>
            </Pressable>
          </Card>
        )}
        ListFooterComponent={
          <View style={{ gap: space.sm, paddingTop: space.md }}>
            {cardsQuery.data && cardsQuery.data.pagination.pageCount > 1 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                <Button
                  label={uz.common.back}
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                />
                <Text variant="caption" tone="subtle">
                  {page} {uz.common.of} {cardsQuery.data.pagination.pageCount}
                </Text>
                <Button
                  label={uz.study.summaryMoreLeft}
                  size="sm"
                  variant="outline"
                  disabled={page >= cardsQuery.data.pagination.pageCount}
                  onPress={() => setPage((current) => current + 1)}
                />
              </View>
            ) : null}

            <Button
              label={uz.deck.edit}
              variant="outline"
              size="sm"
              block
              onPress={() => router.push(`/deck-form?deckId=${deckId}`)}
            />
            <Button
              label={uz.common.delete}
              variant="ghost"
              size="sm"
              block
              onPress={confirmDeleteDeck}
            />
          </View>
        }
      />
    </Screen>
  );
}
