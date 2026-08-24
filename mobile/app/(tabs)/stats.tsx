import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { LevelBoard } from "@/components/stats/level-board";
import { StatsStrip } from "@/components/stats/stats-strip";
import { Card, ErrorState, LoadingState, Text } from "@/components/ui";
import { getStats } from "@/lib/api/endpoints/stats";
import { ApiError } from "@/lib/api/error";
import { formatAccuracy, formatCount } from "@/lib/domain/format";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { qk } from "@/lib/query/keys";
import { useTheme } from "@/lib/theme/theme-context";

export default function StatsTab() {
  const { colors, space } = useTheme();

  const { data, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: qk.stats(undefined),
    queryFn: () => getStats(),
  });

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
      <ScrollView
        contentContainerStyle={{ padding: space.md, gap: space.md }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
      >
        <Text variant="title">{uz.stats.title}</Text>

        <StatsStrip
          items={[
            { label: uz.stats.totalCards, value: formatCount(data.total_cards) },
            { label: uz.stats.dueNow, value: formatCount(data.due_now), tone: colors.accent },
            {
              label: uz.stats.mastered,
              value: formatCount(data.mastered),
              tone: colors.mastered,
            },
            { label: uz.stats.notStarted, value: formatCount(data.not_started) },
          ]}
        />

        <Card>
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text variant="body" tone="muted">
                {uz.stats.reviewsToday}
              </Text>
              <Text variant="bodyStrong">{formatCount(data.reviews_today)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text variant="body" tone="muted">
                {uz.stats.accuracy7d}
              </Text>
              <Text variant="bodyStrong">{formatAccuracy(data.accuracy_7d)}</Text>
            </View>
          </View>
        </Card>

        <LevelBoard buckets={data.by_level} />
      </ScrollView>
    </Screen>
  );
}
