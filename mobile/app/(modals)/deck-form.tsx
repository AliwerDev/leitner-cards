import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Input, Text } from "@/components/ui";
import { useForm } from "@/hooks/use-form";
import { useCreateDeck, useDeck, useUpdateDeck } from "@/hooks/use-decks";
import { DECK_COLOR_COUNT, deckSwatches } from "@/lib/domain/deck-color";
import { DIRECTION_OPTIONS } from "@/lib/domain/direction";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { deckCreateSchema } from "@/lib/validation/deck";
import { DeckDirection } from "@/types/api";

/**
 * Create or edit a deck. `?deckId=` present means edit.
 *
 * One screen for both because the fields are identical and the only difference
 * is which mutation runs - two screens would duplicate the colour picker and
 * the direction picker for nothing.
 */
export default function DeckFormScreen() {
  const params = useLocalSearchParams<{ deckId?: string }>();
  const deckId = params.deckId ? Number(params.deckId) : null;
  const editing = deckId !== null && !Number.isNaN(deckId);

  const router = useRouter();
  const { radius, resolved, space } = useTheme();

  const existing = useDeck(editing ? deckId : 0);
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck(editing ? deckId : 0);

  const loaded = editing ? existing.data : undefined;

  const [name, setName] = useState(loaded?.name ?? "");
  const [description, setDescription] = useState(loaded?.description ?? "");
  const [color, setColor] = useState<number | null>(loaded?.color ?? null);
  const [direction, setDirection] = useState<DeckDirection>(
    loaded?.direction ?? DeckDirection.FrontToBack,
  );

  // The deck loads after the first render, so seed the fields once it arrives.
  const [seeded, setSeeded] = useState(!editing);
  if (editing && !seeded && existing.data) {
    setName(existing.data.name);
    setDescription(existing.data.description ?? "");
    setColor(existing.data.color);
    setDirection(existing.data.direction ?? DeckDirection.FrontToBack);
    setSeeded(true);
  }

  const form = useForm({
    schema: deckCreateSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        description: values.description || null,
        color: values.color ?? null,
        direction: values.direction,
      };
      return editing
        ? await updateDeck.mutateAsync(payload)
        : await createDeck.mutateAsync(payload);
    },
    onSuccess: () => router.back(),
  });

  const swatches = deckSwatches(resolved);

  return (
    <Screen scroll contentStyle={{ gap: space.md, paddingTop: space.md }}>
      <Stack.Screen options={{ title: editing ? uz.deck.edit : uz.deck.create }} />

      {form.message ? <Alert tone="warning" message={form.message} /> : null}

      <Input
        label={uz.deck.name}
        value={name}
        onChangeText={setName}
        error={form.fields.name}
        autoFocus={!editing}
      />

      <Input
        label={`${uz.mobile.deckDescription} (${uz.common.optional})`}
        value={description}
        onChangeText={setDescription}
        error={form.fields.description}
        multiline
      />

      <View style={{ gap: space.xs }}>
        <Text variant="label" tone="muted">
          {uz.deck.color}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
          {Array.from({ length: DECK_COLOR_COUNT }, (_, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              onPress={() => setColor(index)}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: swatches[index],
                borderWidth: color === index ? 3 : 0,
                // The ring is the surface colour so it reads as a gap between
                // the swatch and its selected outline.
                borderColor: swatches[index],
                opacity: color === index ? 1 : 0.55,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: space.xs }}>
        <Text variant="label" tone="muted">
          {uz.deck.direction}
        </Text>
        <View style={{ flexDirection: "row", gap: space.xs }}>
          {DIRECTION_OPTIONS.map((option) => (
            <View key={option.value} style={{ flex: 1 }}>
              <Button
                label={option.label}
                size="sm"
                block
                variant={direction === option.value ? "primary" : "outline"}
                onPress={() => setDirection(option.value)}
              />
            </View>
          ))}
        </View>
        <Text variant="caption" tone="subtle">
          {uz.deck.directionHint}
        </Text>
      </View>

      <Button
        label={uz.common.save}
        block
        loading={form.submitting}
        onPress={() => void form.submit({ name, description, color, direction })}
      />
    </Screen>
  );
}
