import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Card, Text } from "@/components/ui";
import { formatAccuracy } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import type { AnswerRecord } from "./use-study-session";

/**
 * What just happened, and what to do next.
 *
 * The retry button appears only when a write actually failed. It retries the
 * in-session list; anything still unsent after that is in the durable outbox
 * and will go out on the next foreground or reconnect, so nothing is lost even
 * if the user leaves from here.
 */

export type StudySummaryProps = {
  answers: AnswerRecord[];
  failedCount: number;
  queueWasFull: boolean;
  onRetryFailed: () => void;
  onFinish: () => void;
  onContinue: () => void;
};

export function StudySummary({
  answers,
  failedCount,
  queueWasFull,
  onRetryFailed,
  onFinish,
  onContinue,
}: StudySummaryProps) {
  const { colors, space } = useTheme();

  const total = answers.length;
  const correct = answers.filter((a) => a.wasCorrect).length;
  const mastered = answers.filter((a) => a.wasCorrect && a.levelAfter === 8).length;

  // A ratio in 0..1 to match the shape the API uses for accuracy elsewhere,
  // and null on an empty session so it reads "no data" rather than "0%".
  const accuracy = total === 0 ? null : correct / total;

  return (
    <Screen
      scroll
      topInset={false}
      contentStyle={{ flexGrow: 1, justifyContent: "center", gap: space.md }}
    >
      <Text variant="title" style={{ textAlign: "center" }}>
        {uz.study.summaryTitle}
      </Text>

      <Card>
        <View style={{ gap: space.sm }}>
          <SummaryRow label={uz.study.summaryTotal} value={String(total)} />
          <SummaryRow
            label={uz.study.summaryCorrect}
            value={String(correct)}
            color={colors.correct}
          />
          <SummaryRow
            label={uz.study.summaryWrong}
            value={String(total - correct)}
            color={colors.wrong}
          />
          <SummaryRow label={uz.study.summaryAccuracy} value={formatAccuracy(accuracy)} />
          {mastered > 0 ? (
            <SummaryRow
              label={uz.study.summaryMastered}
              value={String(mastered)}
              color={colors.mastered}
            />
          ) : null}
        </View>
      </Card>

      {failedCount > 0 ? (
        <Alert
          tone="warning"
          title={uz.mobile.pendingTitle}
          message={uz.mobile.pendingBody(failedCount)}
          action={
            <View style={{ marginTop: space["2xs"], alignSelf: "flex-start" }}>
              <Button
                label={uz.study.resendAnswers}
                size="sm"
                variant="outline"
                onPress={onRetryFailed}
              />
            </View>
          }
        />
      ) : null}

      <View style={{ gap: space.xs }}>
        {queueWasFull ? (
          <Button label={uz.study.summaryMoreLeft} block onPress={onContinue} />
        ) : null}
        <Button
          label={uz.common.back}
          variant={queueWasFull ? "outline" : "primary"}
          block
          onPress={onFinish}
        />
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text variant="body" tone="muted">
        {label}
      </Text>
      <Text variant="heading" style={color ? { color } : undefined}>
        {value}
      </Text>
    </View>
  );
}
