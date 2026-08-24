import { View } from "react-native";
import { Card, Text } from "@/components/ui";
import { deckAccent } from "@/lib/domain/deck-color";
import { directionLabel } from "@/lib/domain/direction";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import type { Deck } from "@/types/api";

/**
 * One deck in the list.
 *
 * The color stripe is the whole reason deck.color exists, so it carries real
 * weight here rather than being a dot in a corner. It runs along the top edge,
 * where it spans the full width of the card.
 */
export function DeckCard({ deck, onPress }: { deck: Deck; onPress: () => void }) {
  const { colors, radius, resolved, space } = useTheme();
  const accent = deckAccent(deck.color, deck.id, resolved);

  return (
    <Card onPress={onPress} padded={false} style={{ overflow: "hidden" }}>
      <View
        style={{
          height: 5,
          backgroundColor: accent,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }}
      />

      <View style={{ padding: space.md, gap: space["3xs"] }}>
        <Text variant="heading" numberOfLines={1}>
          {deck.name}
        </Text>

        {deck.description ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {deck.description}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: space["2xs"] }}>
          <Text variant="caption" tone="subtle">
            {directionLabel(deck.direction)}
          </Text>
          <Text variant="caption" style={{ color: colors.borderStrong }}>
            ·
          </Text>
          <Text variant="caption" tone="subtle">
            {uz.deck.one}
          </Text>
        </View>
      </View>
    </Card>
  );
}
