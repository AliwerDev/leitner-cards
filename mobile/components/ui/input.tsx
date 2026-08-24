import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";
import { Text } from "./text";

/**
 * A labelled text field with its error slot.
 *
 * Label, control, and message are one component rather than three, because the
 * error state has to change the border as well as print the message, and
 * splitting that across components means every form re-implements the wiring.
 *
 * `error` takes the string the API or zod produced. Field errors from a 422
 * arrive keyed by field name, so a screen passes `fields.front` straight in.
 */

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, containerStyle, style, multiline, ...rest },
  ref,
) {
  const { colors, radius, space, fontSize } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.borderFocus : colors.border;

  return (
    <View style={[{ gap: space["2xs"] }, containerStyle]}>
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}

      <TextInput
        ref={ref}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        placeholderTextColor={colors.textSubtle}
        style={[
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: 1,
            borderRadius: radius.md,
            color: colors.text,
            fontSize: fontSize.md,
            paddingHorizontal: space.sm,
            // A multiline box needs vertical padding and a taller floor; a
            // single line is centred by its fixed height instead.
            paddingVertical: multiline ? space.sm : 0,
            height: multiline ? undefined : 46,
            minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
        {...rest}
      />

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
