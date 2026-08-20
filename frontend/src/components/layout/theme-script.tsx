import { THEME_STORAGE_KEY } from "@/lib/utils/theme-storage";

/**
 * Applies the stored theme before first paint.
 *
 * This must be an inline, synchronous script in <head>. Any async or
 * component-driven approach paints the light theme first and then swaps, which
 * is a visible flash on every reload for dark-theme users.
 */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark" ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
