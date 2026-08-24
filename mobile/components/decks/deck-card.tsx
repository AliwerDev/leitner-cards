import { Layers } from "lucide-react-native";
import { View } from "react-native";
import { Card, Text } from "@/components/ui";
import { deckAccent } from "@/lib/domain/deck-color";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import type { Deck } from "@/types/api";
import type { DeckCounts } from "@/hooks/use-decks";

/** Matches NAV_ICON_STROKE on the web. */
const ICON_STROKE = 1.75;

/**
 * One deck in the list.
 *
 * Carries the same fields as the web's DeckCard
 * (frontend/src/components/decks/deck-card.tsx): the name, a due badge, and
 * the card count. The description and the direction are deliberately absent -
 * they belong to the deck form and the detail screen, not to a list row.
 *
 * The color stripe runs along the top edge, where it spans the full width.
 */
export function DeckCard({
  deck,
  counts,
  onPress,
}: {
  deck: Deck;
  /** Absent while the counts are still loading, or past the fanout limit. */
  counts?: DeckCounts;
  onPress: () => void;
}) {
  const { colors, radius, resolved, space } = useTheme();
  const accent = deckAccent(deck.color, deck.id, resolved);

  const total = counts?.total ?? 0;
  const due = counts?.due ?? 0;

  return (
    <Card onPress={onPress} padded={false} style={{ overflow: "hidden" }}>
      <View
        style={{
          height: 4,
          backgroundColor: accent,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }}
      />

      <View style={{ padding: space.md, gap: space.xs }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.xs }}>
          <Text variant="heading" numberOfLines={2} style={{ flex: 1 }}>
            {deck.name}
          </Text>

          {due > 0 ? (
            <View
              style={{
                backgroundColor: accent,
                borderRadius: radius.full,
                paddingHorizontal: space.xs,
                paddingVertical: space["3xs"],
              }}
            >
              <Text variant="caption" tone="onAccent">
                {due}
              </Text>
            </View>
          ) : null}
        </View>

        {/* The count row is held back until the numbers arrive: a placeholder
            reading "0 ta karta" would be wrong rather than merely empty. */}
        {counts ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: space["2xs"] }}>
            <Layers color={colors.textMuted} size={16} strokeWidth={ICON_STROKE} />

            {total > 0 ? (
              <>
                <Text variant="caption" tone="muted">
                  {uz.deck.cardCountLabel(total)}
                </Text>
                {due > 0 ? (
                  <>
                    <Text variant="caption" tone="muted">
                      ·
                    </Text>
                    <Text variant="caption" style={{ color: accent }}>
                      {uz.deck.readyCount(due)}
                    </Text>
                  </>
                ) : null}
              </>
            ) : (
              <Text variant="caption" tone="muted">
                {uz.deck.noCards}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </Card>
  );
}
