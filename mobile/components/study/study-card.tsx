import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * The card that turns over, and that is swiped away to answer.
 *
 * ANDROID BACKFACE. `backfaceVisibility: "hidden"` works on iOS and is
 * unreliable on Android - the single biggest gotcha in every React Native flip
 * card. So the faces are swapped by opacity at the halfway point instead,
 * which behaves identically on both platforms. Opacity is binary here, not a
 * fade: a cross-fade through the midpoint would show both faces at once.
 *
 * The timing mirrors the web's --duration-flip (850ms) and --ease-flip, which
 * eases in and out evenly so the long turn does not lurch at the start.
 *
 * SWIPE. Once the answer is showing, a drag to the left answers "wrong" and a
 * drag to the right answers "correct" - the same two actions as the buttons
 * below, reachable without moving the thumb to a target. The gesture stays off
 * while the prompt is up, because there is no answer to grade yet.
 */

/** How far the card must travel before the release counts as an answer. */
const SWIPE_THRESHOLD = 110;
/** A flick this fast commits even if it did not reach the distance. */
const SWIPE_VELOCITY = 700;

const SCREEN_WIDTH = Dimensions.get("window").width;

export type StudyCardProps = {
  prompt: string;
  answer: string;
  revealed: boolean;
  onFlip: () => void;
  /** The deck's color, used as the edge accent. */
  accent: string;
  /** Called when the card is swiped away. Omit to disable the gesture. */
  onSwipe?: (wasCorrect: boolean) => void;
};

export function StudyCard({ prompt, answer, revealed, onFlip, accent, onSwipe }: StudyCardProps) {
  const { colors, duration, radius, space, layout, elevation } = useTheme();
  const reduceMotion = useReducedMotion();

  const progress = useDerivedValue(() =>
    withTiming(revealed ? 1 : 0, {
      duration: reduceMotion ? 0 : duration.flip,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  );

  /** Horizontal drag offset. */
  const translateX = useSharedValue(0);

  const commit = (wasCorrect: boolean) => {
    // Recentre before handing over. The parent advances the queue, which
    // reuses these faces for the next card, and a card left off screen would
    // have to slide back in.
    translateX.value = 0;
    onSwipe?.(wasCorrect);
  };

  const pan = Gesture.Pan()
    // Only grade what the user has actually seen.
    .enabled(revealed && onSwipe !== undefined)
    // Take over only on a clear horizontal drag, so a tap still flips.
    .activeOffsetX([-14, 14])
    .failOffsetY([-24, 24])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const past = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      const flicked = Math.abs(event.velocityX) > SWIPE_VELOCITY;

      if (past || flicked) {
        const wasCorrect = event.translationX > 0;
        // Off the screen edge first, then answer.
        translateX.value = withTiming(
          Math.sign(event.translationX) * SCREEN_WIDTH * 1.2,
          { duration: reduceMotion ? 0 : duration.fast },
          (finished) => {
            if (finished) runOnJS(commit)(wasCorrect);
          },
        );
        return;
      }

      // Short of the threshold: return to centre.
      translateX.value = withTiming(0, { duration: reduceMotion ? 0 : duration.normal });
    });

  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success) runOnJS(onFlip)();
  });

  // Race, not Simultaneous: a drag must not also register as a tap and flip
  // the card back over on release.
  const gesture = Gesture.Race(pan, tap);

  /** The whole stack drags and leans as one. */
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      // A slight lean in the direction of travel, so the card reads as thrown
      // rather than slid.
      {
        rotateZ: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          [-12, 0, 12],
        )}deg`,
      },
    ],
  }));

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

  /** The verdict a release right now would produce. */
  const wrongHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], "clamp"),
  }));

  const correctHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], "clamp"),
  }));

  const face = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderTopColor: accent,
    borderTopWidth: 4,
    flex: 1,
    padding: space.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    ...elevation.md,
  };

  const badge = {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: space.sm,
    paddingVertical: space["2xs"],
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityRole="button"
        accessibilityLabel={revealed ? answer : prompt}
        accessibilityHint={revealed && onSwipe ? uz.study.swipeHint : undefined}
        style={[{ flex: 1, minHeight: layout.studyCardMinHeight }, containerStyle]}
      >
        <Animated.View style={[styles.face, face, frontStyle]}>
          <Text variant="display" style={styles.text}>
            {prompt}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.face, face, styles.stacked, backStyle]}>
          <Text variant="display" style={styles.text}>
            {answer}
          </Text>
        </Animated.View>

        {/* The verdict badges sit above both faces, so the flip does not turn
            them over with the card. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.badge, { top: space.md, left: space.md }, wrongHintStyle]}
        >
          <View style={[badge, { borderColor: colors.wrong }]}>
            <Text variant="bodyStrong" style={{ color: colors.wrong }}>
              {uz.study.wrong}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.badge, { top: space.md, right: space.md }, correctHintStyle]}
        >
          <View style={[badge, { borderColor: colors.correct }]}>
            <Text variant="bodyStrong" style={{ color: colors.correct }}>
              {uz.study.correct}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
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
  badge: {
    position: "absolute",
  },
});
