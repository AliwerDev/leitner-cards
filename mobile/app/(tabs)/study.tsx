import { useRouter } from "expo-router";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Button, EmptyState, ErrorState, LoadingState, Text } from "@/components/ui";
import { useDueCount } from "@/hooks/use-due";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * The Study tab: the entry point, not the session.
 *
 * The session itself is /study, outside (tabs), because it is a full-screen
 * task - the tab bar is a distraction mid-session and the header back button
 * is the single way out. This screen only decides whether there is anything to
 * start.
 */
export default function StudyTab() {
  const router = useRouter();
  const { space } = useTheme();
  const { data, isPending, error, refetch } = useDueCount();

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

  const due = data.due_count;

  if (due === 0) {
    return (
      <Screen>
        <EmptyState title={uz.study.empty} body={uz.study.emptyHint} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ flex: 1, justifyContent: "center", gap: space.lg }}>
      <View style={{ alignItems: "center", gap: space["2xs"] }}>
        <Text variant="display">{due}</Text>
        <Text variant="body" tone="muted">
          {uz.stats.dueNow}
        </Text>
      </View>

      <Button label={uz.study.title} size="lg" block onPress={() => router.push("/study")} />
    </Screen>
  );
}
