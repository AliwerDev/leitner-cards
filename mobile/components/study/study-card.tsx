import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
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
 * below, reachable without moving the thumb to a target. The surface tints
 * red or green as it travels, so the verdict is legible before the release.
 * The gesture stays off while the prompt is up, because there is no answer to
 * grade yet.
 */

/** How far the card must travel before the release counts as an answer. */
const SWIPE_THRESHOLD = 110;
/** A flick this fast commits even if it did not reach the distance. */
const SWIPE_VELOCITY = 700;
/** How strongly the surface takes the verdict color at full travel. */
const TINT_STRENGTH = 0.16;

const SCREEN_WIDTH = Dimensions.get("window").width;

export type StudyCardProps = {
  /** Identifies the card on show. A change resets the turn without animating. */
  cardId: number;
  prompt: string;
  answer: string;
  revealed: boolean;
  onFlip: () => void;
  /** The deck's color, used as the edge accent. */
  accent: string;
  /** Called when the card is swiped away. Omit to disable the gesture. */
  onSwipe?: (wasCorrect: boolean) => void;
};

export function StudyCard({
  cardId,
  prompt,
  answer,
  revealed,
  onFlip,
  accent,
  onSwipe,
}: StudyCardProps) {
  const { colors, duration, radius, space, layout, elevation } = useTheme();
  const reduceMotion = useReducedMotion();

  /** 0 shows the prompt, 1 shows the answer. */
  const progress = useSharedValue(revealed ? 1 : 0);
  /** Horizontal drag offset. */
  const translateX = useSharedValue(0);

  /**
   * Turning the card over.
   *
   * Driven by an effect rather than useDerivedValue so that a NEW CARD can
   * snap back to the prompt instead of animating. Deriving it meant answering
   * a revealed card ran the turn backwards - the next card arrived already
   * showing its face and visibly rotated 180 degrees to hide it again.
   *
   * Answering changes `revealed` and `cardId` in the same render, so both are
   * handled here in one effect: the card that changed identity snaps, and only
   * a deliberate flip of the same card animates. Splitting this in two would
   * leave the outcome resting on the order the effects happen to run in.
   */
  const shown = useRef(cardId);

  useEffect(() => {
    const isNewCard = shown.current !== cardId;
    shown.current = cardId;

    const target = revealed ? 1 : 0;

    if (isNewCard) {
      // Cancel whatever the outgoing card was doing and start face down.
      cancelAnimation(progress);
      progress.value = target;
      return;
    }

    progress.value = withTiming(target, {
      duration: reduceMotion ? 0 : duration.flip,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [cardId, revealed, reduceMotion, duration.flip, progress]);

  const commit = (wasCorrect: boolean) => {
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
        // Off the screen edge first, then answer. The card-change effect
        // recentres it, so this never has to slide back.
        translateX.value = withTiming(
          Math.sign(event.translationX) * SCREEN_WIDTH * 1.2,
          { duration: reduceMotion ? 0 : duration.fast },
          (finished) => {
            if (finished) {
              // Recentre on the UI thread before handing over, so the incoming
              // card is never left sitting off screen.
              translateX.value = 0;
              runOnJS(commit)(wasCorrect);
            }
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

  /**
   * The verdict tint.
   *
   * A wash of color across the surface rather than a badge: the card is
   * already the thing under the thumb, so tinting it says the same thing
   * without another element appearing on top of the text.
   */
  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [colors.wrong, colors.surface, colors.correct],
    ),
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, TINT_STRENGTH],
      "clamp",
    ),
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

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityRole="button"
        accessibilityLabel={revealed ? answer : prompt}
        accessibilityHint={revealed && onSwipe ? uz.study.swipeHint : undefined}
        style={[{ flex: 1, minHeight: layout.studyCardMinHeight }, containerStyle]}
      >
        <Animated.View style={[styles.face, face, frontStyle]}>
          <Text variant="title" adjustsFontSizeToFit minimumFontScale={0.6} style={styles.text}>
            {prompt}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.face, face, styles.stacked, backStyle]}>
          <Text variant="title" adjustsFontSizeToFit minimumFontScale={0.6} style={styles.text}>
            {answer}
          </Text>
        </Animated.View>

        {/* The tint rides above both faces, so the turn does not carry it
            round with the card. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.stacked, { borderRadius: radius.xl }, tintStyle]}
        />
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
});
