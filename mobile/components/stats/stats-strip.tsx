import { View } from "react-native";
import { Card, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-context";

/** A row of headline numbers. Two per line, so the labels have room to wrap. */
export function StatsStrip({ items }: { items: { label: string; value: string; tone?: string }[] }) {
  const { space } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {items.map((item) => (
        <Card key={item.label} style={{ flexGrow: 1, flexBasis: "45%" }}>
          <View style={{ gap: space["3xs"] }}>
            <Text variant="display" style={item.tone ? { color: item.tone } : undefined}>
              {item.value}
            </Text>
            <Text variant="caption" tone="muted">
              {item.label}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}
