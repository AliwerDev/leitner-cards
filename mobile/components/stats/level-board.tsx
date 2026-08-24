import { View } from "react-native";
import { Card, Text } from "@/components/ui";
import { levelIntervalDays } from "@/lib/domain/level";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { CardLevel, type LevelBucket } from "@/types/api";

/**
 * The Leitner ladder as a bar per level.
 *
 * The API always returns all eight buckets, zero-filled, so no gap-filling is
 * needed here. Level 8 is drawn in the mastered role rather than the accent:
 * it is an end state, not another rung.
 */
export function LevelBoard({ buckets }: { buckets: LevelBucket[] }) {
  const { colors, radius, space } = useTheme();

  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <Card>
      <View style={{ gap: space.sm }}>
        <Text variant="heading">{uz.stats.byLevel}</Text>

        <View style={{ gap: space.xs }}>
          {buckets.map((bucket) => {
            const mastered = bucket.level === CardLevel.Mastered;
            const interval = levelIntervalDays(bucket.level);

            return (
              <View key={bucket.level} style={{ gap: space["3xs"] }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text variant="caption" tone="muted">
                    {mastered ? uz.stats.masteredShort : uz.stats.levelShort(bucket.level)}
                    {interval === null || mastered
                      ? ""
                      : interval === 0
                        ? ` · ${uz.stats.intervalToday}`
                        : ` · ${uz.stats.intervalDays(interval)}`}
                  </Text>
                  <Text variant="caption">{bucket.count}</Text>
                </View>

                <View
                  style={{
                    height: 6,
                    backgroundColor: colors.surfaceSunken,
                    borderRadius: radius.full,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      // A zero-count level still shows the track, just no fill.
                      width: `${(bucket.count / max) * 100}%`,
                      height: "100%",
                      backgroundColor: mastered ? colors.mastered : colors.accent,
                      borderRadius: radius.full,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}
