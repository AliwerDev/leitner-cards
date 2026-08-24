"use client";

import { motion, useReducedMotion } from "motion/react";
import { CtaLink } from "./cta-link";
import { HeroVisual } from "./hero-visual";
import { uz } from "@/lib/i18n/uz";

/**
 * The hero.
 *
 * A client component only so the entrance can animate; the session is read on
 * the server and arrives as signedIn. The copy and the visual are unchanged
 * from the server version, so nothing here needs data at runtime.
 *
 * The entrance runs on mount rather than on scroll: the hero is already in
 * view when the page loads, and a scroll trigger would never fire.
 */

/** Matches --ease-out in globals.css. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const RISE = 16;

export function Hero({ signedIn }: { signedIn: boolean }) {
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: RISE },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: EASE_OUT, delay },
        };

  return (
    <section className="py-3xl gap-2xl grid items-center md:grid-cols-2">
      <div className="gap-lg flex flex-col">
        <motion.p
          className="text-accent-text text-sm font-medium tracking-wide uppercase"
          {...rise(0)}
        >
          {uz.landing.heroEyebrow}
        </motion.p>

        <motion.h1 className="text-fg text-4xl" {...rise(0.08)}>
          {uz.landing.heroTitle}
        </motion.h1>

        <motion.p className="text-fg-muted text-lg" {...rise(0.16)}>
          {uz.landing.heroBody}
        </motion.p>

        <motion.div className="gap-sm flex flex-wrap" {...rise(0.24)}>
          {signedIn ? (
            <CtaLink href="/decks">{uz.landing.ctaSignedIn}</CtaLink>
          ) : (
            <>
              <CtaLink href="/register">{uz.landing.ctaPrimary}</CtaLink>
              <CtaLink href="/login" variant="secondary">
                {uz.landing.ctaSecondary}
              </CtaLink>
            </>
          )}
        </motion.div>
      </div>

      {/* The halo sits behind the visual and is decorative, so it is blurred
          rather than drawn. It scales with the visual because it is absolutely
          positioned inside the same box. */}
      <motion.div className="relative" {...rise(0.2)}>
        <div
          className="bg-glow absolute inset-0 -z-10 scale-90 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <HeroVisual />
      </motion.div>
    </section>
  );
}
