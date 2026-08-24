import { Pressable, View, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * A raised surface. The default container for anything that is a discrete
 * item in a list: a deck, a card row, a stat block.
 */

export type CardProps = ViewProps & {
  onPress?: () => void;
  padded?: boolean;
  /** Adds a shadow. Off by default: a list of 40 shadowed views is expensive. */
  raised?: boolean;
  style?: ViewStyle;
};

export function Card({ onPress, padded = true, raised = false, style, children, ...rest }: CardProps) {
  const { colors, radius, space, elevation } = useTheme();

  const surface: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: padded ? space.md : 0,
    ...(raised
      ? {
          shadowColor: colors.shadow,
          shadowOpacity: 0.1,
          ...elevation.sm,
        }
      : null),
  };

  if (!onPress) {
    return (
      <View style={[surface, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        surface,
        pressed ? { backgroundColor: colors.surfaceHover } : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
