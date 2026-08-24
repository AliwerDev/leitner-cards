/**
 * Layer 1: primitives. The ONLY file in the app that contains raw color values.
 *
 * These are the OKLCH ramps from frontend/src/app/globals.css, converted to
 * sRGB hex by scripts/oklch-to-hex.mjs. React Native cannot parse oklch(), so
 * the conversion happens at authoring time rather than on the device. To change
 * a color, edit the OKLCH value in the web token file, re-run
 * `node scripts/oklch-to-hex.mjs --all`, and paste the result here - that keeps
 * the two apps the same color and keeps OKLCH as the source of truth, which is
 * what makes the ramps perceptually even.
 *
 * Components never name a primitive. They name a semantic role from themes.ts.
 * ESLint enforces this by banning hex literals everywhere except this file.
 */

export const palette = {
  neutral0: "#ffffff",
  neutral50: "#f9fafb",
  neutral100: "#f0f3f5",
  neutral200: "#e2e6e9",
  neutral300: "#cfd3d8",
  neutral400: "#9aa0a7",
  neutral500: "#6c747b",
  neutral600: "#4e555c",
  neutral700: "#373e44",
  neutral800: "#21272d",
  neutral900: "#12181d",
  neutral950: "#050b10",

  accent100: "#dde8ff",
  accent200: "#c4d8ff",
  accent300: "#a1c0ff",
  accent500: "#3d72ee",
  accent600: "#295ad4",
  accent700: "#214cb8",
  accent900: "#0d2769",

  success100: "#d8f6dc",
  success500: "#18a349",
  success600: "#018939",
  success700: "#006b2b",
  success900: "#023613",

  danger100: "#ffe4e0",
  danger500: "#e22326",
  danger600: "#c50a17",
  danger700: "#a20711",
  danger900: "#530305",

  warning100: "#fff0d2",
  warning500: "#f69e04",
  warning600: "#d78100",
  warning700: "#ad620c",
  warning900: "#512a00",

  info100: "#d9efff",
  info500: "#0090d4",
  info600: "#0079b3",
  info700: "#006191",
  info900: "#00314c",

  /** Dark-theme one-offs: roles that are not a step on any ramp. */
  darkSurfaceSunken: "#020509",
  darkSuccessText: "#78ce89",
  darkDangerHover: "#f45249",
  darkDangerText: "#ff8579",
  darkWarningText: "#ffc166",
  darkInfoText: "#62bbf5",
} as const;

/**
 * The 8 deck hues, in a fixed order. `deck.color` is an integer index into this
 * list, so the palette can be restyled - including per theme - with no data
 * migration. Dark needs its own set: these hues are chosen to sit on a light
 * surface and go muddy on a near-black one.
 */
export const deckPalette = {
  light: ["#3d72ee", "#18a349", "#e22326", "#f69e04", "#0090d4", "#ae42c5", "#00a59e", "#6c747b"],
  dark: ["#6594fa", "#56be6e", "#f36358", "#faab3f", "#44a8e7", "#c86edc", "#2ac3bb", "#999fa6"],
} as const;

/**
 * Shadow colors. RN takes a color plus an opacity rather than a CSS shadow
 * string, so the web's composite shadows collapse into these two values and the
 * elevation levels in tokens.ts.
 */
export const shadowColor = {
  light: "#12181d",
  dark: "#000000",
} as const;
