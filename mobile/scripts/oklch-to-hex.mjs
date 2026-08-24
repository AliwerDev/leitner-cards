/**
 * Convert the OKLCH primitives in frontend/src/app/globals.css into sRGB hex.
 *
 * React Native's style engine does not understand oklch(), so the conversion
 * has to happen somewhere. Doing it here - once, at authoring time - rather
 * than at runtime keeps the cost off the device and keeps lib/theme/palette.ts
 * a file of plain values that anyone can read.
 *
 * The math is the standard OKLab -> linear sRGB pipeline from Björn Ottosson's
 * reference, plus gamut clipping by chroma reduction: if a color falls outside
 * sRGB (some of the vivid accents do), chroma is walked down until it fits,
 * which preserves hue and lightness. Naive per-channel clamping would shift
 * the hue instead.
 *
 * Usage: node scripts/oklch-to-hex.mjs "oklch(58.5% 0.196 264)"
 *        node scripts/oklch-to-hex.mjs --all      (prints every palette entry)
 */

function oklchToLinearSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Linear sRGB -> gamma-encoded sRGB. */
function encode(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function inGamut([r, g, b]) {
  const eps = 1e-6;
  return [r, g, b].every((c) => c >= -eps && c <= 1 + eps);
}

export function oklchToHex(L, C, h) {
  let chroma = C;
  let rgb = oklchToLinearSrgb(L, chroma, h);

  // Walk chroma down until the color fits in sRGB. Hue and lightness are kept.
  if (!inGamut(rgb)) {
    let low = 0;
    let high = chroma;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinearSrgb(L, mid, h))) low = mid;
      else high = mid;
    }
    chroma = low;
    rgb = oklchToLinearSrgb(L, chroma, h);
  }

  return (
    "#" +
    rgb
      .map((c) => {
        const v = Math.round(Math.min(1, Math.max(0, encode(c))) * 255);
        return v.toString(16).padStart(2, "0");
      })
      .join("")
  );
}

/** Parse `oklch(58.5% 0.196 264)` or `oklch(58.5% 0.196 264 / 0.14)`. */
export function parseOklch(text) {
  const match = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/.exec(text);
  if (!match) throw new Error(`Cannot parse: ${text}`);
  const [, l, c, h, alpha] = match;
  return {
    L: Number(l) / 100,
    C: Number(c),
    h: Number(h),
    alpha: alpha === undefined ? 1 : Number(alpha),
  };
}

export function convert(text) {
  const { L, C, h, alpha } = parseOklch(text);
  const hex = oklchToHex(L, C, h);
  if (alpha === 1) return hex;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return hex + a;
}

const PALETTE = {
  "neutral-0": "oklch(100% 0 0)",
  "neutral-50": "oklch(98.4% 0.002 247)",
  "neutral-100": "oklch(96.2% 0.004 247)",
  "neutral-200": "oklch(92.2% 0.006 247)",
  "neutral-300": "oklch(86.5% 0.008 247)",
  "neutral-400": "oklch(70.4% 0.012 247)",
  "neutral-500": "oklch(55.4% 0.014 247)",
  "neutral-600": "oklch(44.6% 0.014 247)",
  "neutral-700": "oklch(36% 0.014 247)",
  "neutral-800": "oklch(26.9% 0.014 247)",
  "neutral-900": "oklch(20.5% 0.014 247)",
  "neutral-950": "oklch(14.5% 0.016 247)",
  "accent-100": "oklch(93% 0.043 264)",
  "accent-200": "oklch(88% 0.068 264)",
  "accent-300": "oklch(80.9% 0.105 264)",
  "accent-500": "oklch(58.5% 0.196 264)",
  "accent-600": "oklch(51.1% 0.196 264)",
  "accent-700": "oklch(45.7% 0.178 264)",
  "accent-900": "oklch(30% 0.12 264)",
  "success-100": "oklch(94.5% 0.048 149)",
  "success-500": "oklch(62.7% 0.17 149)",
  "success-600": "oklch(55% 0.155 149)",
  "success-700": "oklch(46% 0.13 149)",
  "success-900": "oklch(29% 0.08 149)",
  "danger-100": "oklch(94% 0.036 27)",
  "danger-500": "oklch(58.6% 0.222 27)",
  "danger-600": "oklch(52% 0.208 27)",
  "danger-700": "oklch(45% 0.18 27)",
  "danger-900": "oklch(28% 0.11 27)",
  "warning-100": "oklch(96% 0.05 85)",
  "warning-500": "oklch(76.9% 0.166 70)",
  "warning-600": "oklch(68% 0.155 65)",
  "warning-700": "oklch(57% 0.13 60)",
  "warning-900": "oklch(33% 0.08 60)",
  "info-100": "oklch(94% 0.035 240)",
  "info-500": "oklch(62.3% 0.152 240)",
  "info-600": "oklch(55% 0.145 240)",
  "info-700": "oklch(47% 0.125 240)",
  "info-900": "oklch(30% 0.08 240)",
  "deck-1": "oklch(58.5% 0.196 264)",
  "deck-2": "oklch(62.7% 0.17 149)",
  "deck-3": "oklch(58.6% 0.222 27)",
  "deck-4": "oklch(76.9% 0.166 70)",
  "deck-5": "oklch(62.3% 0.152 240)",
  "deck-6": "oklch(58% 0.21 320)",
  "deck-7": "oklch(65% 0.14 190)",
  "deck-8": "oklch(55.4% 0.014 247)",
  "deck-dark-1": "oklch(68% 0.16 264)",
  "deck-dark-2": "oklch(72% 0.15 149)",
  "deck-dark-3": "oklch(68% 0.18 27)",
  "deck-dark-4": "oklch(80% 0.15 70)",
  "deck-dark-5": "oklch(70% 0.13 240)",
  "deck-dark-6": "oklch(68% 0.18 320)",
  "deck-dark-7": "oklch(74% 0.12 190)",
  "deck-dark-8": "oklch(70% 0.012 247)",
  "dark-surface-sunken": "oklch(11% 0.016 247)",
  "dark-success-text": "oklch(78% 0.13 149)",
  "dark-danger-hover": "oklch(66% 0.2 27)",
  "dark-danger-text": "oklch(75% 0.15 27)",
  "dark-warning-text": "oklch(85% 0.13 75)",
  "dark-info-text": "oklch(76% 0.12 240)",
};

if (process.argv.includes("--all")) {
  for (const [name, value] of Object.entries(PALETTE)) {
    console.log(`${name.padEnd(22)} ${value.padEnd(30)} ${convert(value)}`);
  }
} else {
  const arg = process.argv[2];
  if (arg) console.log(convert(arg));
}
