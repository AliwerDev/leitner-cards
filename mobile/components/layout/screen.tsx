import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * The canvas every screen sits on.
 *
 * Three things it exists to stop being re-solved per screen: the canvas
 * background (a transparent root borrows whatever is behind it and breaks the
 * dark theme), the safe-area inset at the bottom, and keyboard avoidance,
 * which needs different behaviour per platform - iOS slides the whole view,
 * Android resizes it.
 */

export type ScreenProps = {
  children: React.ReactNode;
  /** Wrap the content in a ScrollView. Off for screens that own their scrolling. */
  scroll?: boolean;
  padded?: boolean;
  /** Extra bottom room, e.g. for a floating action row. */
  bottomInset?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  bottomInset = 0,
  style,
  contentStyle,
}: ScreenProps) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();

  const padding: ViewStyle = {
    paddingHorizontal: padded ? space.md : 0,
    paddingBottom: insets.bottom + bottomInset,
  };

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padding, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[{ flex: 1, backgroundColor: colors.canvas }, style]}
    >
      {body}
    </KeyboardAvoidingView>
  );
}
