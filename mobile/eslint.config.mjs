import expo from "eslint-config-expo/flat";

/**
 * Mirrors frontend/eslint.config.mjs where the reasoning carries over.
 *
 * The frontend bans arbitrary Tailwind values and the default palette because a
 * className is an untyped string, so a wrong token fails silently. Here the
 * theme is a typed object and `theme.colors.surface` is checked by the
 * compiler, so that whole class of error is already impossible. What remains
 * worth banning is the escape hatch: a raw hex literal written inline instead
 * of a semantic role.
 */
export default [
  ...expo,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Raw hex colors belong only in lib/theme/palette.ts. Use a semantic role from useTheme().",
        },
      ],
    },
  },
  {
    // The palette is the one file allowed to name raw colors, and the sync
    // checker compares copied files byte for byte.
    ignores: ["node_modules/**", ".expo/**", "dist/**", "lib/theme/palette.ts", "scripts/**"],
  },
];
