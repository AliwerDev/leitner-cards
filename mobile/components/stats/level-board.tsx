import { View } from "react-native";
import { Text } from "@/components/ui";
import { levelIntervalDays } from "@/lib/domain/level";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { CardLevel, type LevelBucket } from "@/types/api";

/**
 * The Leitner ladder as eight tiles in a row, mirroring the web level board.
 *
 * The API always returns all eight buckets, zero-filled, so no gap-filling is
 * needed here. A tile is "filled" when it holds at least one card; an empty one
 * keeps the sunken surface so the ladder reads as a full row either way.
 * Level 8 is drawn in the mastered role rather than the accent: it is an end
 * state, not another rung.
 */
export function LevelBoard({ buckets }: { buckets: LevelBucket[] }) {
  const { colors, radius, space, fontSize, weight } = useTheme();

  return (
    <View
      accessibilityLabel={uz.stats.byLevel}
      style={{ flexDirection: "row", alignItems: "flex-end", gap: space.xs }}
    >
      {buckets.map((bucket) => {
        const mastered = bucket.level === CardLevel.Mastered;
        const filled = bucket.count > 0;
        // The web tints with bg-accent/5. DeckAccentProvider re-points `accent`
        // but not `accentSubtle`, so the tint is mixed from the live accent -
        // otherwise a colored deck would show the default blue here.
        const tone = mastered ? colors.mastered : colors.accent;

        return (
          <View
            key={bucket.level}
            accessibilityLabel={`${
              mastered ? uz.stats.masteredShort : uz.stats.levelShort(bucket.level)
            }: ${uz.stats.cardsInLevel(bucket.count)}`}
            style={{ flex: 1, alignItems: "center", gap: space["2xs"] }}
          >
            <Text variant="caption" tone={filled ? "default" : "subtle"}>
              {bucket.count}
            </Text>

            <View
              style={{
                width: "100%",
                paddingVertical: space.sm,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: filled ? tone : colors.border,
                backgroundColor: filled ? tint(tone) : colors.surfaceSunken,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: weight.medium,
                  color: filled ? tone : colors.textMuted,
                }}
              >
                {mastered ? "★" : String(bucket.level)}
              </Text>
            </View>

            <Text variant="caption" tone="subtle" numberOfLines={1}>
              {intervalHint(bucket.level)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** The web shows this in a tooltip; a phone has no hover, so it sits under the tile. */
function intervalHint(level: CardLevel): string {
  const days = levelIntervalDays(level);
  if (days === null) return "";
  if (days === 0) return uz.stats.intervalToday;
  return `${days}k`;
}

/** `bg-accent/5` as an 8-digit hex, since RN styles take no color-mix(). */
function tint(hex: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}0d` : hex;
}
