// The .js extension is required: this is an ESM config, and a directory import
// is not resolvable from one.
import expo from "eslint-config-expo/flat.js";

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
    /**
     * types/api.ts pairs each const-object enum with a type of the same name,
     * which is the standard way to get an erasable enum in TypeScript. A value
     * and a type can share a name, so this is not a real redeclaration - and
     * the file is a verbatim copy of the frontend's, so it must not be edited
     * to silence a linter.
     */
    files: ["types/api.ts"],
    rules: { "@typescript-eslint/no-redeclare": "off" },
  },
  {
    // The palette is the one file allowed to name raw colors, and the sync
    // checker compares copied files byte for byte.
    ignores: ["node_modules/**", ".expo/**", "dist/**", "lib/theme/palette.ts", "scripts/**"],
  },
];
