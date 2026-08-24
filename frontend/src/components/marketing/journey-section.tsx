"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { JourneyStage } from "./journey-stage";
import { LadderVisual } from "./ladder-visual";
import { uz } from "@/lib/i18n/uz";

/**
 * The journey: five stages in a vertical zigzag, joined by a drawn line.
 *
 * The connector is one absolutely-positioned track behind the stages, not a
 * line segment per stage. Its fill scales on the Y axis as the section passes
 * the viewport, so the line appears to draw itself downward. One element and
 * one transform, rather than five that each have to meet at the seams.
 *
 * The rail sits under the node column: centred on desktop, at the left edge on
 * a phone. Those offsets have to track the node size in journey-stage.tsx.
 */

/** Which stage carries the ladder. Stage 3 is where the schedule is explained. */
const LADDER_STAGE_INDEX = 2;

export function JourneySection() {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Measured from the section entering the bottom of the viewport to it
  // leaving the top, so the line finishes as the last stage lands.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.6"],
  });

  // Without the spring the line tracks the wheel exactly and reads as jittery.
  const smoothed = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const scaleY = useTransform(smoothed, [0, 1], [0, 1]);

  return (
    <section className="py-3xl">
      <p className="text-accent-text mb-2xs text-center text-sm font-medium tracking-wide uppercase">
        {uz.landing.journeyEyebrow}
      </p>
      <h2 className="text-fg mb-2xl text-center text-2xl">{uz.landing.journeyTitle}</h2>

      <div ref={containerRef} className="relative">
        {/* The rail track. On a phone the node column is one node wide, so the
            rail sits half a node in; --journey-rail-offset carries that. On
            desktop the node column is centred, so the rail is at 50%. Both
            then shift back by half their own width. */}
        <div
          className="bg-rail absolute top-0 bottom-0 left-(--journey-rail-offset) w-px -translate-x-1/2 md:left-1/2"
          aria-hidden="true"
        >
          <motion.div
            className="bg-rail-fill h-full w-full origin-top"
            style={reduceMotion ? { scaleY: 1 } : { scaleY }}
          />
        </div>

        <div className="gap-2xl relative flex flex-col">
          {uz.landing.journey.map((stage, index) => (
            <JourneyStage
              key={stage.title}
              stage={stage}
              index={index}
              visual={index === LADDER_STAGE_INDEX ? <LadderVisual /> : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
