import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * A stack inside the Decks tab, so pushing a deck keeps the tab bar visible
 * and the back gesture works within the tab.
 */
export default function DecksLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
