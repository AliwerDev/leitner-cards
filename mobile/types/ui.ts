// COPIED FROM frontend/src/types/ui.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

/** Shared prop unions for UI primitives. */

export type Size = "sm" | "md" | "lg";

export type Tone = "neutral" | "accent" | "success" | "danger" | "warning" | "info";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

export type Theme = "light" | "dark" | "system";

/** The theme actually applied to the document. "system" resolves to one of these. */
export type ResolvedTheme = "light" | "dark";
