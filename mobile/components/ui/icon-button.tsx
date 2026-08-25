import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";
import type { ButtonVariant, Size } from "@/types/ui";

/**
 * A button whose whole content is an icon.
 *
 * Button is not this: it requires a `label` and always draws that text beside
 * the icon, which is right for an action in a form and wrong for one sitting
 * in a title row where there is no width to spend.
 *
 * The label still has to exist, it just moves to accessibilityLabel. An icon
 * alone tells a screen reader nothing, so the prop is required rather than
 * optional - a plus with no name is unusable.
 *
 * Square, by the same heights Button uses, so the two line up when they share
 * a row.
 */

export type IconButtonProps = {
  icon: React.ReactNode;
  /** What the icon means. Read aloud; never drawn. */
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
};

const SIZE: Record<Size, number> = { sm: 36, md: 44, lg: 52 };

export function IconButton({
  icon,
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
}: IconButtonProps) {
  const { colors, radius, space } = useTheme();

  const surface: Record<ButtonVariant, { background: string; border: string }> = {
    primary: { background: colors.accent, border: colors.accent },
    secondary: { background: colors.surfaceSunken, border: colors.surfaceSunken },
    ghost: { background: "transparent", border: "transparent" },
    danger: { background: colors.danger, border: colors.danger },
    outline: { background: "transparent", border: colors.borderStrong },
  };

  const tone = surface[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // The icon is smaller than the target, so the press area is widened
      // rather than the button drawn larger.
      hitSlop={space.xs}
      style={({ pressed }) => [
        styles.base,
        {
          width: SIZE[size],
          height: SIZE[size],
          borderRadius: radius.md,
          backgroundColor: tone.background,
          borderColor: tone.border,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
