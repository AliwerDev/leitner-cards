import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * The card that turns over.
 *
 * ANDROID BACKFACE. `backfaceVisibility: "hidden"` works on iOS and is
 * unreliable on Android - the single biggest gotcha in every React Native flip
 * card. So the faces are swapped by opacity at the halfway point instead,
 * which behaves identically on both platforms. Opacity is binary here, not a
 * fade: a cross-fade through the midpoint would show both faces at once.
 *
 * The timing mirrors the web's --duration-flip (850ms) and --ease-flip, which
 * eases in and out evenly so the long turn does not lurch at the start.
 */

export type StudyCardProps = {
  prompt: string;
  answer: string;
  revealed: boolean;
  onFlip: () => void;
  /** The deck's color, used as the edge accent. */
  accent: string;
};

export function StudyCard({ prompt, answer, revealed, onFlip, accent }: StudyCardProps) {
  const { colors, duration, radius, space, layout, elevation } = useTheme();
  const reduceMotion = useReducedMotion();

  const progress = useDerivedValue(() =>
    withTiming(revealed ? 1 : 0, {
      duration: reduceMotion ? 0 : duration.flip,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  );

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
      // A 3% swell at the midpoint, matching the web. It reads as the card
      // lifting off the surface rather than spinning flat.
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.03, 1]) },
    ],
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.03, 1]) },
    ],
    opacity: progress.value < 0.5 ? 0 : 1,
  }));

  const face = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderTopColor: accent,
    borderTopWidth: 4,
    minHeight: layout.studyCardMinHeight,
    padding: space.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    ...elevation.md,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={revealed ? answer : prompt}
      onPress={onFlip}
      style={{ minHeight: layout.studyCardMinHeight }}
    >
      <View style={{ minHeight: layout.studyCardMinHeight }}>
        <Animated.View style={[styles.face, face, frontStyle]}>
          <Text variant="title" style={styles.text}>
            {prompt}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.face, styles.stacked, face, backStyle]}>
          <Text variant="title" style={styles.text}>
            {answer}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: "center",
    justifyContent: "center",
  },
  /** The back sits on top of the front; opacity decides which one is seen. */
  stacked: {
    ...StyleSheet.absoluteFill,
  },
  text: {
    textAlign: "center",
  },
});
