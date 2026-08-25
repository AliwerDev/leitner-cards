/// <reference types="node" />
import type { ExpoConfig } from "expo/config";

/**
 * There is no `newArchEnabled` here: SDK 57 removed the flag because the New
 * Architecture is the only architecture. Setting it is now a type error.
 *
 * `userInterfaceStyle: "automatic"` is required for the dark theme to work at
 * all: without it the OS reports "light" forever and useColorScheme() can never
 * resolve to dark.
 *
 * `usesCleartextTraffic` is required because the development backend is plain
 * HTTP, and Android API 28+ blocks that by default - the failure surfaces as an
 * opaque network error rather than anything naming TLS. It lives under
 * expo-build-properties rather than `android` because it is a native build
 * setting, and it therefore applies to development and production builds only.
 * Expo Go already permits cleartext, so this changes nothing until you build.
 */
/** palette.neutral50, the light canvas in lib/theme/palette.ts. */
const LIGHT_CANVAS = "#f9fafb";

const config: ExpoConfig = {
  name: "Magic Memorizer",
  slug: "magic-memorizer",
  owner: "aliwerdev",
  scheme: "magicmemorizer",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-splash-screen",
    ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
  ],
  // The native window color, before any JS paints. Left unset it is white, and
  // it shows through as a flash at launch and behind screen transitions. This
  // is the light canvas; expo-system-ui switches it to the dark one as soon as
  // the theme resolves in app/_layout.tsx.
  backgroundColor: LIGHT_CANVAS,
  ios: {
    supportsTablet: false,
    bundleIdentifier: "uz.magicmemorizer.app",
    backgroundColor: LIGHT_CANVAS,
  },
  android: {
    package: "uz.magicmemorizer.app",
    backgroundColor: LIGHT_CANVAS,
    versionCode: 1,
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  extra: {
    // `eas init` cannot write this itself, because app.config.ts is a dynamic
    // config rather than static JSON. Without it `eas build` cannot tell which
    // EAS project this is.
    eas: { projectId: "77807df8-0c59-4a7b-93c7-ab53d91c8d59" },
    // `undefined`, never `null`: Expo serializes a null in `extra` into an
    // empty object, and `{}` is truthy - which crashed lib/api/config.ts on
    // start. An undefined key is simply omitted.
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? undefined,
    apiTimeoutMs: 10000,
    tokenRefreshSkewSeconds: 120,
  },
};

export default config;
