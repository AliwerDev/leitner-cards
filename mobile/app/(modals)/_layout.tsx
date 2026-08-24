import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme/theme-context";

export default function ModalsLayout() {
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
