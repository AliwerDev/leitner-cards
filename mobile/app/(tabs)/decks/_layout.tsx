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
    >
      {/* The list draws its own title, so a header here would only repeat it -
          and with no title set it fell back to the route name, "index". */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* The title is set on the screen itself, once the deck name is loaded. */}
      <Stack.Screen name="[deckId]/index" options={{ title: "" }} />
    </Stack>
  );
}
