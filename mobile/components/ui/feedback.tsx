import { ActivityIndicator, View, type ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";
import { Button } from "./button";
import { Text } from "./text";
import type { Tone } from "@/types/ui";

/**
 * The four states every screen in this app has to be able to show: busy,
 * empty, wrong, and a note about something.
 *
 * They live in one file because they are always considered together - a screen
 * that handles loading but not error is not finished - and keeping them
 * adjacent makes the missing one obvious.
 */

export function Spinner({ size = "large" }: { size?: "small" | "large" }) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={colors.accent} />;
}

/** Centred spinner for a screen that has nothing to show yet. */
export function LoadingState({ style }: { style?: ViewStyle }) {
  const { space } = useTheme();
  return (
    <View style={[{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl }, style]}>
      <Spinner />
    </View>
  );
}

export type EmptyStateProps = {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export function EmptyState({ title, body, actionLabel, onAction, icon }: EmptyStateProps) {
  const { space } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: space.xl,
        gap: space.xs,
      }}
    >
      {icon ? <View style={{ marginBottom: space["2xs"] }}>{icon}</View> : null}
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body ? (
        <Text variant="body" tone="muted" style={{ textAlign: "center" }}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: space.sm }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel: string;
};

export function ErrorState({ message, onRetry, retryLabel }: ErrorStateProps) {
  const { space } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: space.xl,
        gap: space.sm,
      }}
    >
      <Text variant="body" tone="danger" style={{ textAlign: "center" }}>
        {message}
      </Text>
      {onRetry ? <Button label={retryLabel} variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

export type AlertProps = {
  tone?: Tone;
  title?: string;
  message: string;
  action?: React.ReactNode;
};

/** An inline notice. Used for quota limits and the offline outbox banner. */
export function Alert({ tone = "neutral", title, message, action }: AlertProps) {
  const { colors, radius, space } = useTheme();

  const palette: Record<Tone, { background: string; text: string }> = {
    neutral: { background: colors.surfaceSunken, text: colors.text },
    accent: { background: colors.accentSubtle, text: colors.accentText },
    success: { background: colors.successSubtle, text: colors.successText },
    danger: { background: colors.dangerSubtle, text: colors.dangerText },
    warning: { background: colors.warningSubtle, text: colors.warningText },
    info: { background: colors.infoSubtle, text: colors.infoText },
  };

  const chosen = palette[tone];

  return (
    <View
      style={{
        backgroundColor: chosen.background,
        borderRadius: radius.md,
        padding: space.sm,
        gap: space["2xs"],
      }}
    >
      {title ? (
        <Text variant="label" style={{ color: chosen.text }}>
          {title}
        </Text>
      ) : null}
      <Text variant="caption" style={{ color: chosen.text }}>
        {message}
      </Text>
      {action}
    </View>
  );
}
