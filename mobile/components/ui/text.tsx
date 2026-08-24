import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";
import type { FontSize } from "@/lib/theme/tokens";

/**
 * Every piece of text in the app goes through here.
 *
 * Bare <Text> inherits nothing useful in React Native - not a color, not a
 * size - so a forgotten style renders as unthemed black on a dark background.
 * Routing through one component means the default is always a themed one, and
 * a variant is a named role rather than a pile of style props.
 */

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption"
  | "mono";

export type TextTone = "default" | "muted" | "subtle" | "accent" | "onAccent" | "danger" | "success";

const VARIANTS: Record<TextVariant, { size: FontSize; weight: TextStyle["fontWeight"]; leading: number }> = {
  display: { size: "3xl", weight: "600", leading: 1.2 },
  title: { size: "2xl", weight: "600", leading: 1.2 },
  heading: { size: "lg", weight: "600", leading: 1.2 },
  body: { size: "md", weight: "400", leading: 1.5 },
  bodyStrong: { size: "md", weight: "500", leading: 1.5 },
  label: { size: "sm", weight: "500", leading: 1.5 },
  caption: { size: "xs", weight: "400", leading: 1.5 },
  mono: { size: "sm", weight: "400", leading: 1.5 },
};

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

export function Text({ variant = "body", tone = "default", style, ...rest }: TextProps) {
  const { colors, fontSize } = useTheme();

  const spec = VARIANTS[variant];
  const size = fontSize[spec.size];

  const toneColor: Record<TextTone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    subtle: colors.textSubtle,
    accent: colors.accentText,
    onAccent: colors.textOnAccent,
    danger: colors.dangerText,
    success: colors.successText,
  };

  return (
    <RNText
      style={[
        {
          color: toneColor[tone],
          fontSize: size,
          fontWeight: spec.weight,
          // RN wants line height in pixels, not a ratio.
          lineHeight: Math.round(size * spec.leading),
        },
        style,
      ]}
      {...rest}
    />
  );
}
