import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";
import { Text } from "./text";
import type { ButtonVariant, Size } from "@/types/ui";

/**
 * The button.
 *
 * Variants match the web's ButtonVariant union so a screen ported from the
 * frontend asks for the same thing by the same name.
 *
 * Sizing is thumb-first: the medium height is 44, which is the smallest target
 * Apple's HIG accepts and comfortably above Android's 48dp guidance once the
 * row padding is counted. The web's equivalent is smaller because a mouse is
 * more precise than a thumb.
 */

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to the container width. The default on forms. */
  block?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const HEIGHT: Record<Size, number> = { sm: 36, md: 44, lg: 52 };

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  block = false,
  icon,
  style,
}: ButtonProps) {
  const { colors, radius, space, fontSize } = useTheme();
  const inactive = disabled || loading;

  const surface: Record<ButtonVariant, { background: string; border: string; text: string }> = {
    primary: { background: colors.accent, border: colors.accent, text: colors.textOnAccent },
    secondary: {
      background: colors.surfaceSunken,
      border: colors.surfaceSunken,
      text: colors.text,
    },
    ghost: { background: "transparent", border: "transparent", text: colors.text },
    danger: { background: colors.danger, border: colors.danger, text: colors.textOnAccent },
    outline: { background: "transparent", border: colors.borderStrong, text: colors.text },
  };

  const tone = surface[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: size === "sm" ? space.sm : space.md,
          borderRadius: radius.md,
          backgroundColor: tone.background,
          borderColor: tone.border,
          // No hover on a touch screen, so the pressed state carries the whole
          // affordance and is stronger than the web's equivalent.
          opacity: inactive ? 0.45 : pressed ? 0.75 : 1,
          alignSelf: block ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.text} size="small" />
      ) : (
        <View style={[styles.content, { gap: space.xs }]}>
          {icon}
          <Text
            style={{ color: tone.text, fontSize: size === "sm" ? fontSize.sm : fontSize.md }}
            variant="bodyStrong"
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
});
