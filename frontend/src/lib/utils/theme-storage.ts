/**
 * Shared by the pre-paint inline script (a server component) and the client
 * theme hook. It lives in its own module so the server component does not have
 * to import a "use client" file just to read a string.
 */
export const THEME_STORAGE_KEY = "leitner-theme";
