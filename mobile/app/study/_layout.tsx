import { Stack, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * The study stack, deliberately outside (tabs).
 *
 * A session is a full-screen task: the tab bar is not reachable from inside a
 * tab stack, so this route sits at the root and pushes over the tabs. The
 * header carries the only way out, which is why the back control is explicit
 * here rather than left to the default.
 */
export default function StudyLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: colors.canvas },
        headerLeft: () => <BackButton />,
      }}
    />
  );
}

function BackButton() {
  const router = useRouter();
  const { colors, space } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={uz.common.back}
      onPress={() => router.back()}
      hitSlop={space.xs}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingRight: space.xs })}
    >
      <ChevronLeft color={colors.text} size={26} strokeWidth={2} />
    </Pressable>
  );
}
