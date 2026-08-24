"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui";

/**
 * One stage of the journey.
 *
 * Each stage is its own three-column grid row - content, rail, content - so a
 * stage places itself and the section does not have to track row numbers. The
 * side decides which content column the card fills; the other one stays empty
 * and holds the row open.
 *
 * On a phone the grid collapses to rail-then-content, so the zigzag becomes a
 * plain left-rail timeline. Keeping the alternation at phone width would leave
 * each card about ten characters wide.
 */

/** Matches --ease-out in globals.css. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Matches --ease-spring. The node overshoots a little as it lands. */
const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

/** How far the card travels in, in pixels. Small: this is a settle, not a fly-in. */
const SLIDE = 24;

export type JourneyStageData = {
  title: string;
  body: string;
  pain: string;
  tag: string;
};

export function JourneyStage({
  stage,
  index,
  visual,
}: {
  stage: JourneyStageData;
  index: number;
  /** Optional illustration rendered under the body, e.g. the review ladder. */
  visual?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  // Odd stages take the left column, even ones the right. Stage 1 is index 0.
  const onLeft = index % 2 === 0;

  const enter = reduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT, delay: 0.05 };

  const nodeEnter = reduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: EASE_SPRING, delay: 0.15 };

  const card = (
    <motion.div
      // Phone: always column 2, to the right of the rail. Desktop: column 1 or
      // 3 by side. Placing the single card by column beats rendering it twice.
      className={onLeft ? "col-start-2 md:col-start-1" : "col-start-2 md:col-start-3"}
      initial={reduceMotion ? false : { opacity: 0, x: onLeft ? -SLIDE : SLIDE }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={enter}
    >
      <Card variant="raised" padding="lg" className="gap-sm flex flex-col text-left">
        {/* The pain this stage answers, in the visitor's own words. */}
        <p className="text-fg-subtle text-sm italic">&ldquo;{stage.pain}&rdquo;</p>

        <h3 className="text-fg text-xl">{stage.title}</h3>
        <p className="text-fg-muted text-sm">{stage.body}</p>

        <span className="bg-accent-subtle text-accent-text px-sm py-2xs self-start rounded-full text-xs font-medium">
          {stage.tag}
        </span>

        {visual ? <div className="mt-xs">{visual}</div> : null}
      </Card>
    </motion.div>
  );

  const node = (
    <motion.div
      // Row 1 in both layouts, so the node and the card share a row whichever
      // column the card took.
      className="col-start-1 row-start-1 flex justify-center md:col-start-2"
      initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={nodeEnter}
      aria-hidden="true"
    >
      {/* The size comes from --journey-node-size, because journey-section.tsx
          derives the rail offset from the same token. The border is the canvas
          colour, so the node punches a gap in the rail it sits on. */}
      <span
        className="bg-accent text-fg-on-accent border-canvas flex flex-none items-center justify-center rounded-full border-4 text-sm font-semibold tabular-nums"
        style={{
          width: "var(--journey-node-size)",
          height: "var(--journey-node-size)",
        }}
      >
        {index + 1}
      </span>
    </motion.div>
  );

  // Both children place themselves by column, so source order is free and the
  // card is rendered once for both layouts.
  return (
    <div className="gap-md md:gap-x-xl grid grid-cols-[auto_1fr] items-center md:grid-cols-[1fr_auto_1fr]">
      {node}
      {card}
    </div>
  );
}
