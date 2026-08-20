import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/* Design-token enforcement.
 *
 * Tailwind v4 already makes `bg-gray-100` fail to compile, because defining the
 * --color-* namespace in @theme replaces the default palette instead of
 * extending it. These rules exist to turn a silently missing style into a clear
 * error message, and to catch color strings the Tailwind scanner does not see.
 *
 * See src/app/globals.css for the token layer itself. */
const TOKEN_RULES = [
  {
    selector:
      'JSXAttribute[name.name="className"] Literal[value=/\\[(#|[0-9]+(px|rem|em)|rgb|hsl|oklch)/]',
    message:
      "Arbitrary values are banned. Use a token utility (bg-surface, p-md, rounded-lg) or add a semantic role to globals.css.",
  },
  {
    selector:
      'JSXAttribute[name.name="className"] Literal[value=/\\b(bg|text|border|ring|from|to|via|fill|stroke|shadow|decoration|outline|divide|placeholder|accent|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/]',
    message:
      "The Tailwind default palette is banned. Use a semantic role: bg-surface, text-fg-muted, border-border, bg-accent.",
  },
];

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...TOKEN_RULES],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    // globals.css is the token layer; nothing else may hold raw values.
    ignores: ["node_modules/**", ".next/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
