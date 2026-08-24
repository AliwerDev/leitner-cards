import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert as RNAlert, Pressable } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Input } from "@/components/ui";
import { useCreateCard, useDeleteCard, useUpdateCard } from "@/hooks/use-cards";
import { useForm } from "@/hooks/use-form";
import { getCard } from "@/lib/api/endpoints/cards";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { cardCreateSchema } from "@/lib/validation/card";

/** Create or edit a card. `?cardId=` present means edit. */
export default function CardFormScreen() {
  const params = useLocalSearchParams<{ deckId: string; cardId?: string }>();
  const deckId = Number(params.deckId);
  const cardId = params.cardId ? Number(params.cardId) : null;
  const editing = cardId !== null && !Number.isNaN(cardId);

  const router = useRouter();
  const { colors, space } = useTheme();

  const existing = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => getCard(cardId as number),
    enabled: editing,
  });

  const createCard = useCreateCard(deckId);
  const updateCard = useUpdateCard(deckId);
  const deleteCard = useDeleteCard(deckId);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const [seeded, setSeeded] = useState(!editing);
  if (editing && !seeded && existing.data) {
    setFront(existing.data.front);
    setBack(existing.data.back);
    setSeeded(true);
  }

  const confirmDelete = () => {
    if (!editing) return;

    RNAlert.alert(uz.card.deleteTitle, uz.card.deleteConfirm, [
      { text: uz.common.cancel, style: "cancel" },
      {
        text: uz.common.delete,
        style: "destructive",
        // Close first: leaving the form open over a card that no longer
        // exists would let the user save it back.
        onPress: () => {
          router.back();
          deleteCard.mutate(cardId);
        },
      },
    ]);
  };

  const form = useForm({
    schema: cardCreateSchema,
    onSubmit: async (values) =>
      editing
        ? await updateCard.mutateAsync({
            id: cardId,
            front: values.front,
            back: values.back,
          })
        : await createCard.mutateAsync({ front: values.front, back: values.back }),
    onSuccess: () => router.back(),
  });

  return (
    <Screen scroll contentStyle={{ gap: space.md, paddingTop: space.md }}>
      <Stack.Screen
        options={{
          title: editing ? uz.card.edit : uz.card.create,
          // Only an existing card can be deleted.
          headerRight: editing
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={uz.card.deleteTitle}
                  onPress={confirmDelete}
                  hitSlop={space.xs}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Trash2 color={colors.danger} size={22} strokeWidth={1.75} />
                </Pressable>
              )
            : undefined,
        }}
      />

      {/* Quota rejections land on fields.deckId, which has no input of its own,
          so useForm lifts them here as a form-level message. */}
      {form.message ? <Alert tone="warning" message={form.message} /> : null}

      <Input
        label={uz.card.front}
        value={front}
        onChangeText={setFront}
        error={form.fields.front}
        multiline
        autoFocus={!editing}
      />

      <Input
        label={uz.card.back}
        value={back}
        onChangeText={setBack}
        error={form.fields.back}
        multiline
      />

      <Button
        label={uz.common.save}
        block
        loading={form.submitting}
        onPress={() => void form.submit({ deckId, front, back })}
      />
    </Screen>
  );
}
