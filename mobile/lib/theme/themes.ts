import { deckPalette, palette, shadowColor } from "./palette";

/**
 * Layer 2: semantic roles. This is the vocabulary components may name.
 *
 * Mirrors the light and dark blocks in frontend/src/app/globals.css one for
 * one. A component asks for `colors.surface`, never for `palette.neutral0`, so
 * a theme change is a change to this file and nothing else.
 *
 * The dark theme is not the light theme inverted: accents are lifted a step
 * (a 600-weight indigo on a near-black surface fails contrast for text) and the
 * deck hues use their own lighter set.
 */

export type ThemeColors = {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  surfaceHover: string;
  surfaceActive: string;

  text: string;
  textMuted: string;
  textSubtle: string;
  textInverted: string;
  textOnAccent: string;

  border: string;
  borderStrong: string;
  borderFocus: string;

  accent: string;
  accentHover: string;
  accentSubtle: string;
  accentText: string;

  success: string;
  successSubtle: string;
  successText: string;

  danger: string;
  dangerHover: string;
  dangerSubtle: string;
  dangerText: string;

  warning: string;
  warningSubtle: string;
  warningText: string;

  info: string;
  infoSubtle: string;
  infoText: string;

  /** Study-loop roles. The one place these semantics are defined. */
  mastered: string;
  masteredSubtle: string;
  correct: string;
  wrong: string;

  shadow: string;
};

const light: ThemeColors = {
  canvas: palette.neutral50,
  surface: palette.neutral0,
  surfaceRaised: palette.neutral0,
  surfaceSunken: palette.neutral100,
  surfaceHover: palette.neutral100,
  surfaceActive: palette.neutral200,

  text: palette.neutral900,
  textMuted: palette.neutral600,
  textSubtle: palette.neutral500,
  textInverted: palette.neutral0,
  textOnAccent: palette.neutral0,

  border: palette.neutral200,
  borderStrong: palette.neutral300,
  borderFocus: palette.accent500,

  accent: palette.accent600,
  accentHover: palette.accent700,
  accentSubtle: palette.accent100,
  accentText: palette.accent700,

  success: palette.success600,
  successSubtle: palette.success100,
  successText: palette.success700,

  danger: palette.danger600,
  dangerHover: palette.danger700,
  dangerSubtle: palette.danger100,
  dangerText: palette.danger700,

  warning: palette.warning600,
  warningSubtle: palette.warning100,
  warningText: palette.warning700,

  info: palette.info600,
  infoSubtle: palette.info100,
  infoText: palette.info700,

  mastered: palette.accent600,
  masteredSubtle: palette.accent100,
  correct: palette.success600,
  wrong: palette.danger600,

  shadow: shadowColor.light,
};

const dark: ThemeColors = {
  canvas: palette.neutral950,
  surface: palette.neutral800,
  surfaceRaised: palette.neutral700,
  surfaceSunken: palette.darkSurfaceSunken,
  surfaceHover: palette.neutral700,
  surfaceActive: palette.neutral600,

  text: palette.neutral50,
  textMuted: palette.neutral400,
  textSubtle: palette.neutral500,
  textInverted: palette.neutral950,
  textOnAccent: palette.neutral0,

  border: palette.neutral800,
  borderStrong: palette.neutral700,
  borderFocus: palette.accent500,

  accent: palette.accent500,
  accentHover: palette.accent300,
  accentSubtle: palette.accent900,
  accentText: palette.accent300,

  success: palette.success500,
  successSubtle: palette.success900,
  successText: palette.darkSuccessText,

  danger: palette.danger500,
  dangerHover: palette.darkDangerHover,
  dangerSubtle: palette.danger900,
  dangerText: palette.darkDangerText,

  warning: palette.warning500,
  warningSubtle: palette.warning900,
  warningText: palette.darkWarningText,

  info: palette.info500,
  infoSubtle: palette.info900,
  infoText: palette.darkInfoText,

  mastered: palette.accent500,
  masteredSubtle: palette.accent900,
  correct: palette.success500,
  wrong: palette.danger500,

  shadow: shadowColor.dark,
};

export const themes = { light, dark } as const;

export const deckColors = deckPalette;
