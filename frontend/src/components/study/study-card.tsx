"use client";

import { motion, useReducedMotion } from "motion/react";
import { uz } from "@/lib/i18n/uz";

/**
 * The flashcard itself, as a 3D card that turns over on tap.
 *
 * The card takes its height from the parent, which stretches it to the space
 * that is left between the progress bar and the buttons. Both faces are
 * absolutely positioned, so they stack and fill that height. Text that is
 * longer than the face scrolls inside it, and the card never pushes the
 * buttons off the screen.
 *
 * The turn runs on Motion. Two things animate together, because rotation alone
 * looks flat:
 *
 * 1. The card swells a little at the halfway point, so the turn has some
 *    weight. It stays flat on the Z axis and never moves toward the reader.
 * 2. Each face dims as it turns away from the reader, so the surface catches
 *    the light.
 */

const FACE_CLASS =
  "absolute inset-0 border-border bg-surface p-xl flex flex-col items-center justify-center overflow-y-auto rounded-xl border text-center";

/** Both faces must share this, so the two sides look alike. */
const TEXT_CLASS = "text-lg leading-normal font-medium";

/** No Tailwind utility covers these, so the 3D properties stay inline. */
const BACKFACE_HIDDEN = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
} as const;

/** Matches --ease-flip and --duration-flip in globals.css. */
const EASE_FLIP = [0.4, 0, 0.2, 1] as const;
const DURATION_FLIP = 0.85;

export function StudyCard({
  prompt,
  answer,
  flipped,
  onFlip,
}: {
  prompt: string;
  answer: string;
  flipped: boolean;
  onFlip: () => void;
}) {
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion ? { duration: 0 } : { duration: DURATION_FLIP, ease: EASE_FLIP };

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? uz.study.title : uz.study.reveal}
      className="block h-full w-full cursor-pointer rounded-xl text-left"
      style={{ perspective: "1400px", minHeight: "var(--study-card-min-height)" }}
    >
      <motion.div
        className="relative h-full w-full rounded-xl shadow-sm"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{
          rotateY: flipped ? 180 : 0,
          scale: reduceMotion ? 1 : [1, 1.03, 1],
        }}
        transition={transition}
      >
        <motion.div
          className={FACE_CLASS}
          style={BACKFACE_HIDDEN}
          initial={false}
          animate={{ filter: flipped ? "brightness(0.82)" : "brightness(1)" }}
          transition={transition}
        >
          <p className={`text-fg ${TEXT_CLASS}`}>{prompt}</p>
        </motion.div>

        <motion.div
          className={FACE_CLASS}
          style={{ ...BACKFACE_HIDDEN, rotateY: 180 }}
          initial={false}
          animate={{ filter: flipped ? "brightness(1)" : "brightness(0.82)" }}
          transition={transition}
        >
          <p className={`text-fg ${TEXT_CLASS}`}>{answer}</p>
        </motion.div>
      </motion.div>
    </button>
  );
}
