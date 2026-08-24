/**
 * Layer 1 continued: the non-color scales, from frontend/src/app/globals.css.
 *
 * The web expresses these in rem against a 16px root. React Native has no rem,
 * so every value is multiplied out to the density-independent pixels RN uses.
 * The names are unchanged, so a spacing decision made on the web reads the same
 * here.
 */

/** Spacing. 4px base, t-shirt named so intent survives a refactor. */
export const space = {
  "3xs": 2,
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

/**
 * Content widths, NOT gaps. A separate scale from `space` on purpose: a
 * t-shirt name means one thing in the spacing namespace and another here, so
 * `md` must not resolve to a 16px gap when it is meant to be a column width.
 */
export const measure = {
  xs: 320,
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  "2xl": 672,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  "2xs": 11,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
  "3xl": 36,
  "4xl": 48,
} as const;

/**
 * RN takes lineHeight in pixels, not a ratio, so these are multipliers to apply
 * against a font size rather than values to assign directly.
 */
export const leading = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const weight = {
  normal: "400",
  medium: "500",
  semibold: "600",
} as const;

export const tracking = {
  tight: -0.3,
  normal: 0,
  wide: 0.6,
} as const;

export const duration = {
  instant: 80,
  fast: 140,
  normal: 220,
  slow: 360,
  /** The study card turn. Long on purpose; it is the app's one flourish. */
  flip: 850,
} as const;

/** Layout constants that more than one screen needs to agree on. */
export const layout = {
  studyCardMinHeight: 192,
  dockHeight: 52,
  tabBarHeight: 56,
} as const;

/**
 * Elevation. The web has four composite box-shadows; RN gives one shadow per
 * view, so each level is a shadow spec plus the Android `elevation` that
 * approximates it. `shadowColor` comes from the theme, not from here.
 */
export const elevation = {
  sm: { shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 1 },
  md: { shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 3 },
  lg: { shadowOffset: { width: 0, height: 10 }, shadowRadius: 15, elevation: 6 },
  overlay: { shadowOffset: { width: 0, height: 20 }, shadowRadius: 40, elevation: 12 },
} as const;

export type Space = keyof typeof space;
export type Radius = keyof typeof radius;
export type FontSize = keyof typeof fontSize;
