import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Input, Text } from "@/components/ui";
import { useCreateCards } from "@/hooks/use-cards";
import { ApiError } from "@/lib/api/error";
import { parseCardLines } from "@/lib/domain/card-parse";
import { MAX_BULK_ROWS } from "@/lib/domain/limits";
import { apiErrorMessage, isQuotaError } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * Paste many cards at once.
 *
 * The parse runs on every keystroke so the count and the bad lines update as
 * the user types - the same behaviour as the web dialog, and the reason
 * card-parse.ts is a pure function with no API imports.
 *
 * The backend rejects the whole batch in one transaction if any row fails, so
 * there is never a partial result to reconcile. Its field errors are keyed
 * "cards.0.front", and the index in that key is the index within the PARSED
 * rows, not the line number in the box - blank lines are skipped. Mapping back
 * through `rows[index].line` is what points the user at the right line.
 */
export default function BulkAddScreen() {
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = Number(params.deckId);

  const router = useRouter();
  const { space } = useTheme();
  const createCards = useCreateCards(deckId);

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<string | null>(null);

  const parsed = useMemo(() => parseCardLines(text), [text]);

  const tooMany = parsed.rows.length > MAX_BULK_ROWS;
  const canSubmit = parsed.rows.length > 0 && !tooMany;

  const submit = async () => {
    setError(null);
    setLineErrors(null);

    try {
      await createCards.mutateAsync(
        parsed.rows.map((row) => ({ front: row.front, back: row.back })),
      );
      router.back();
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        setError(uz.errors.unexpected);
        return;
      }

      if (isQuotaError(caught)) {
        setError(Object.values(caught.fields ?? {}).flat()[0] ?? apiErrorMessage(caught));
        return;
      }

      // Turn "cards.3.front" keys back into the line numbers the user sees.
      const lines = new Set<number>();
      for (const key of Object.keys(caught.fields ?? {})) {
        const match = /^cards\.(\d+)\./.exec(key);
        const index = match?.[1] === undefined ? null : Number(match[1]);
        const row = index === null ? undefined : parsed.rows[index];
        if (row) lines.add(row.line);
      }

      if (lines.size > 0) {
        setLineErrors(uz.card.bulkLineErrors([...lines].sort((a, b) => a - b).join(", ")));
      } else {
        setError(apiErrorMessage(caught));
      }
    }
  };

  return (
    <Screen scroll contentStyle={{ gap: space.md, paddingTop: space.md }}>
      <Stack.Screen options={{ title: uz.card.bulkTitle }} />

      {error ? <Alert tone="warning" message={error} /> : null}
      {lineErrors ? <Alert tone="danger" message={lineErrors} /> : null}

      <Input
        label={uz.card.bulkLabel}
        hint={uz.card.bulkHint}
        placeholder={uz.card.bulkPlaceholder}
        value={text}
        onChangeText={setText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        style={{ minHeight: 180 }}
      />

      <View style={{ gap: space["3xs"] }}>
        <Text variant="caption" tone={tooMany ? "danger" : "muted"}>
          {uz.card.bulkReady(parsed.rows.length)}
        </Text>
        {parsed.errors.length > 0 ? (
          <Text variant="caption" tone="danger">
            {uz.card.bulkInvalid(parsed.errors.length)}
          </Text>
        ) : null}
        {tooMany ? (
          <Text variant="caption" tone="danger">
            {uz.card.bulkTooMany(MAX_BULK_ROWS)}
          </Text>
        ) : null}
      </View>

      <Button
        label={uz.common.save}
        block
        disabled={!canSubmit}
        loading={createCards.isPending}
        onPress={() => void submit()}
      />
    </Screen>
  );
}
