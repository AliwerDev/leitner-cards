# Claude Design prompt — Magic Memorizer logo and branding

Copy the block below into Claude Design. Every value in it comes from the code, so do
not change the hex values or the token names.

---

## The brief

Design a logo and a brand identity system for **Magic Memorizer**, a spaced-repetition
flashcard app. Deliver a canvas with the artboards that the "What to deliver" section
lists.

### The product

Magic Memorizer schedules vocabulary reviews with the Leitner box method. The user puts
words on cards, and the app decides which cards are due today. The user answers
`Bilaman` (I know) or `Bilmadim` (I do not know). A correct answer moves the card up one
level. A wrong answer sends the card back to level 1.

The ladder has 8 levels. The intervals in days are fixed for every user: **0, 2, 3, 7,
15, 31, 61**. Level 8 is `O'zlashtirilgan` (Mastered), and the app never schedules that
card again.

- Platforms: iOS and Android (Expo), and a web app (Next.js). Phone-first, portrait
  only, no tablet layout.
- Bundle id: `uz.magicmemorizer.app`. Deep-link scheme: `magicmemorizer`.
- Audience: Uzbek speakers who memorize foreign-language vocabulary. All UI text is
  Uzbek in Latin script.
- Competitors: Anki, Quizlet, Duolingo.
- The product is not launched. It has no users yet.

### The positioning

The promise is the scheduling decision, not the flashcards. Every competitor has
flashcards. The landing page headline is `Bugun nimani takrorlashni tizim hal qiladi` —
the system decides what you review today.

Three proof numbers appear on the landing page. Use them if a graphic needs data:

| Number | Means |
|---|---|
| `8` | daraja (levels) |
| `61` | kungacha oraliq (interval up to 61 days) |
| `0` | qo'lda rejalashtirish (manual scheduling) |

### The tension to resolve

The name says **Magic**, but the product voice is the opposite of magic. It is
deterministic, plain and unhyped. There is no AI, no streaks, no gamification, no
leaderboards. The copy says `Qoida oddiy` — the rule is simple.

Resolve this in one direction: the magic is the **result**, and the mechanism stays
visible. The mark can suggest a small lift or an ascent. The mark must not use wands,
sparkles, stars, wizard hats, top hats or rabbits.

Two user pains that the marketing copy names in the first person:

- `Nimani takrorlashni bilmayman` — I do not know what to review.
- `Yodlaganim bir haftada esimdan chiqadi` — what I memorized is gone in a week.

### The tone

Calm, exact, quiet. The brand removes a decision. It does not add fun. Think of a
well-made instrument, not a toy. Avoid: playful mascots, loud gradients, neon,
glassmorphism, 3D bevels, drop shadows on the mark, and every visual cliche of edtech.

## The design system that exists already

These tokens are in production code. Treat them as fixed constraints, not as
suggestions.

### Accent — indigo

The primary brand color. Hue 264.

| Step | Hex | Use |
|---|---|---|
| 100 | `#dde8ff` | tint |
| 200 | `#c4d8ff` | tint |
| 300 | `#a1c0ff` | tint |
| 500 | `#3d72ee` | accent in the dark theme, focus ring in both themes |
| 600 | `#295ad4` | **accent in the light theme — the core brand color** |
| 700 | `#214cb8` | pressed |
| 900 | `#0d2769` | deep |

### Neutral ramp

Hue 247. A cool blue-grey, not a pure grey.

`#ffffff` `#f9fafb` `#f0f3f5` `#e2e6e9` `#cfd3d8` `#9aa0a7` `#6c747b` `#4e555c`
`#373e44` `#21272d` `#12181d` `#050b10`

### Semantic roles, light theme then dark theme

| Role | Light | Dark |
|---|---|---|
| canvas | `#f9fafb` | `#050b10` |
| surface | `#ffffff` | `#21272d` |
| surfaceRaised | `#ffffff` | `#373e44` |
| surfaceSunken | `#f0f3f5` | `#020509` |
| text | `#12181d` | `#f9fafb` |
| textMuted | `#4e555c` | `#9aa0a7` |
| border | `#e2e6e9` | `#21272d` |
| accent | `#295ad4` | `#3d72ee` |

Both themes are required. The mobile app sets `userInterfaceStyle: automatic`.

### Feedback colors

- Success (correct answer): `#18a349` light, `#56be6e` dark.
- Danger (wrong answer): `#e22326` light, `#f36358` dark.
- Warning: `#f69e04`. Info: `#0090d4`.

### Deck palette — 8 hues

The user picks one of these per deck. A brand pattern or an illustration can use them,
but the logo itself must stay indigo.

Light: `#3d72ee` `#18a349` `#e22326` `#f69e04` `#0090d4` `#ae42c5` `#00a59e` `#6c747b`

Dark: `#6594fa` `#56be6e` `#f36358` `#faab3f` `#44a8e7` `#c86edc` `#2ac3bb` `#999fa6`

### Typography

- Typeface: **Inter**. Subsets latin and latin-ext. The wordmark must work in Inter.
- Available weights: **400, 500 and 600 only**. There is no 700 and no bold. Set
  headings at 600 with tight tracking.
- Headings use tracking `-0.02em` and leading 1.2.
- Size scale in px: 11, 12, 14, 16, 18, 22, 28, 36, 48.
- Uzbek Latin needs the apostrophe glyph in words like `to'plam` and
  `O'zlashtirilgan`. Use the **ASCII apostrophe**, never the typographic one. The
  backend does the same, and mismatched glyphs look wrong side by side.

### Radii and spacing

- Radius in px: 4, 6, 8, 12, 16, and full.
- Space on a 4px base: 2, 4, 8, 12, 16, 24, 32, 48, 64, 96.

### Iconography — a hard constraint on the mark

The codebase states the rule: icon geometry is curve-led. Circles and arcs, not bars and
spikes, so that a row of glyphs does not read as spiky. The icon set is Lucide. Every
stroke is **1.75** at a 24px box.

The logo must sit next to the Lucide glyphs `Layers`, `CirclePlay`, `ChartPie` and
`User` in a tab bar and look like one family. So:

- Match the optical stroke weight of a 1.75 Lucide stroke when the mark is in outline.
- Prefer arcs and circles over sharp corners.
- Round the line caps and the joins.

### Motion

One signature animation exists: the study card flip, **850ms**, ease
`cubic-bezier(0.4, 0, 0.2, 1)`. A code comment calls it "the app's one flourish". If the
mark has an animated build, it must reference this flip and nothing else.

## Visual metaphors already drawn in the code

Reuse or refine these. Do not invent a metaphor that fights them.

1. **The ladder.** `ladder-visual.tsx` draws 8 ascending bars. The height of each bar
   follows `sqrt(days / 61)`, so the rise is fast at first and then flattens. Opacity
   ramps from `0.35` to `1.0` across the 8 levels. The mastered bar is full accent and
   carries a star.
2. **The card face.** `hero-visual.tsx` draws one card labelled `Savol` (question)
   showing the word `ephemeral`, with a green chip and a red chip below it.
3. **The journey rail.** `journey-section.tsx` draws a 5-stage vertical rail with round
   nodes, each node 2.25rem.
4. **The letter M.** The current favicon is a 32px rounded square, radius 7, filled
   `#4f46e5`, with a white geometric `M`. That indigo is **off-palette** and is a
   mistake. The nav island repeats an `M` on a 28px accent circle.

The strongest available idea is the **ascent with a flattening curve**: the intervals
grow 0, 2, 3, 7, 15, 31, 61, so the shape of the data is a curve that rises and then
settles. That curve is the product. Consider building the mark from it.

## What the current assets are

There is no brand identity yet. Say so plainly and replace all of it.

- `frontend/src/app/icon.svg` — the improvised `M` favicon in off-palette indigo.
- No `frontend/public/`, no apple-touch-icon, no Open Graph image, no web manifest.
- `mobile/assets/` holds six **unmodified Expo template placeholders**: `icon.png`
  still shows the default blue chevron with its construction guides visible,
  `splash-icon.png` is the default grid, plus `android-icon-foreground.png`,
  `android-icon-background.png`, `android-icon-monochrome.png` and `favicon.png`.
- The Android adaptive icon background is `#E6F4FE`, which is also off-palette.
- No logo component exists. The brand renders as plain text at weight 500.

## What to deliver

Put each item on its own artboard on one canvas.

### 1. Logomark exploration

Three to four distinct directions. Show each mark at 512px on the light canvas
`#f9fafb`. Under each one, add a one-line rationale that names the metaphor. Show one
direction in outline at 1.75 stroke and the same direction as a solid fill, so the
reader can compare.

### 2. The chosen mark, resolved

- The mark at 512, 128, 64, 32 and 16px, to prove that it survives the small sizes.
- The mark in the light theme on `#f9fafb`, and in the dark theme on `#050b10`.
- The mark in one flat color, black on white and white on black, for the Android
  monochrome icon.
- The clear-space rule and the minimum size, both stated in numbers.

### 3. Wordmark and lockups

- The wordmark `Magic Memorizer` in Inter at weight 500 and at weight 600. Show the
  tracking value that you chose.
- A horizontal lockup, mark then wordmark.
- A stacked lockup, mark above wordmark.
- The mark alone, for the 28px nav badge and for the tab bar.
- The tagline lockup with `Yodlaganingiz esingizda qoladi`.

### 4. App icons

- iOS icon, 1024x1024, square, no rounding baked in, no transparency.
- Android adaptive icon: a foreground layer on transparent, and a flat background color
  from the palette. Keep the mark inside the safe circle, which is 66 percent of the
  1024px canvas. Name the background hex, and replace `#E6F4FE`.
- Android monochrome layer, a single-color silhouette on transparent.
- Favicon at 32px and at 16px.
- Splash screen: the mark centered on `#f9fafb` for light, and on `#050b10` for dark.

### 5. Color and type sheet

Restate the accent ramp, the neutral ramp, the semantic roles for both themes, and the
type scale, as a reference sheet. Add the contrast ratio for the accent on the canvas in
each theme. Mark every pair that fails WCAG AA at 4.5 to 1.

### 6. Applied mockups

- One phone screen of the deck list, in the dark theme, with the mark in the header.
- One phone screen of a study card mid-flip, with the green chip and the red chip.
- The landing page hero, with the headline
  `Bugun nimani takrorlashni tizim hal qiladi`, the three proof numbers `8`, `61` and
  `0`, and the ladder visual.
- One Open Graph card, 1200x630.

### 7. Do and do not

A short sheet: what to do with the mark, and what not to do. Show the wrong uses as
crossed-out examples. Include the wand-and-sparkle trap and the off-palette `#4f46e5`.

## Rules

1. Use only the hex values in this brief. Do not introduce a new hue.
2. Every deliverable works in the light theme and in the dark theme.
3. The accent must pass WCAG AA at 4.5 to 1 against its own canvas. This is why the
   accent lifts from `#295ad4` to `#3d72ee` in the dark theme: a 600 indigo on
   near-black fails the text contrast test.
4. The mark must read at 16px. Test it before you commit to it.
5. Inter only, and only the weights 400, 500 and 600.
6. Curve-led geometry. Round caps and joins. Optical weight matched to a 1.75 Lucide
   stroke.
7. ASCII apostrophes in all Uzbek text.
8. No wand, no sparkle, no star, no wizard hat, no mascot, no gradient mesh, no 3D. The
   one permitted star is the existing mastered-level marker inside the ladder graphic,
   and it is not part of the logo.
9. The mark must be drawable as a flat SVG path, because it ships as `icon.svg` and as
   an Android monochrome layer.
