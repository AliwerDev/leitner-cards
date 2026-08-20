import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * TEMPORARY. Phase 1 verification surface: every token rendered in one place so
 * a theme switch can be judged at a glance. Deleted in Phase 9.
 *
 * Class names are spelled out rather than built from a variable: Tailwind scans
 * source text statically, so `bg-${name}` never compiles to anything.
 */

const SURFACES = [
  { label: "canvas", className: "bg-canvas" },
  { label: "surface", className: "bg-surface" },
  { label: "surface-raised", className: "bg-surface-raised" },
  { label: "surface-sunken", className: "bg-surface-sunken" },
  { label: "surface-hover", className: "bg-surface-hover" },
  { label: "surface-active", className: "bg-surface-active" },
] as const;

const TEXT_ROLES = [
  { label: "fg", className: "text-fg" },
  { label: "fg-muted", className: "text-fg-muted" },
  { label: "fg-subtle", className: "text-fg-subtle" },
] as const;

const TONES = [
  { label: "accent", dot: "bg-accent", surface: "bg-accent-subtle", text: "text-accent-text" },
  { label: "success", dot: "bg-success", surface: "bg-success-subtle", text: "text-success-text" },
  { label: "danger", dot: "bg-danger", surface: "bg-danger-subtle", text: "text-danger-text" },
  { label: "warning", dot: "bg-warning", surface: "bg-warning-subtle", text: "text-warning-text" },
  { label: "info", dot: "bg-info", surface: "bg-info-subtle", text: "text-info-text" },
] as const;

const DECK_COLORS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const SPACING = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

const RADII = [
  { label: "xs", className: "rounded-xs" },
  { label: "sm", className: "rounded-sm" },
  { label: "md", className: "rounded-md" },
  { label: "lg", className: "rounded-lg" },
  { label: "xl", className: "rounded-xl" },
  { label: "full", className: "rounded-full" },
] as const;

const TEXT_SIZES = [
  { label: "2xs", className: "text-2xs" },
  { label: "xs", className: "text-xs" },
  { label: "sm", className: "text-sm" },
  { label: "md", className: "text-md" },
  { label: "lg", className: "text-lg" },
  { label: "xl", className: "text-xl" },
  { label: "2xl", className: "text-2xl" },
  { label: "3xl", className: "text-3xl" },
  { label: "4xl", className: "text-4xl" },
] as const;

const SHADOWS = [
  { label: "sm", className: "shadow-sm" },
  { label: "md", className: "shadow-md" },
  { label: "lg", className: "shadow-lg" },
  { label: "overlay", className: "shadow-overlay" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-sm">
      <h2 className="text-sm font-medium tracking-wide text-fg-subtle uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-2xl px-lg py-xl">
      <header className="flex items-center justify-between gap-md">
        <div>
          <h1 className="text-2xl">Design tokens</h1>
          <p className="text-sm text-fg-muted">
            Har bir qiymat globals.css dagi semantik roldan keladi.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Surfaces">
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
          {SURFACES.map((item) => (
            <div key={item.label} className="overflow-hidden rounded-lg border border-border">
              <div className={`h-16 ${item.className}`} />
              <div className="bg-surface px-sm py-xs font-mono text-2xs text-fg-muted">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Text">
        <div className="flex flex-col gap-2xs rounded-lg border border-border bg-surface p-md">
          {TEXT_ROLES.map((item) => (
            <p key={item.label} className={item.className}>
              Karta darajasi oshdi — <span className="font-mono text-xs">{item.label}</span>
            </p>
          ))}
        </div>
      </Section>

      <Section title="Tones">
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-3">
          {TONES.map((tone) => (
            <div
              key={tone.label}
              className={`flex flex-col gap-xs rounded-lg border border-border p-md ${tone.surface}`}
            >
              <div className="flex items-center gap-xs">
                <span className={`size-4 rounded-full ${tone.dot}`} />
                <span className={`text-sm font-medium ${tone.text}`}>{tone.label}</span>
              </div>
              <p className={`text-xs ${tone.text}`}>Namuna matn</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Deck palette">
        <div className="flex flex-wrap gap-sm">
          {DECK_COLORS.map((index) => (
            <div key={index} className="flex flex-col items-center gap-2xs">
              <div
                className="size-12 rounded-lg border border-border"
                style={{ background: `var(--palette-deck-${index})` }}
              />
              <span className="font-mono text-2xs text-fg-subtle">{index}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div className="flex flex-col gap-2xs rounded-lg border border-border bg-surface p-md">
          {SPACING.map((name) => (
            <div key={name} className="flex items-center gap-sm">
              <span className="w-12 font-mono text-2xs text-fg-subtle">{name}</span>
              <div className="h-3 bg-accent" style={{ width: `var(--space-${name})` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-sm">
          {RADII.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2xs">
              <div
                className={`size-12 border border-border-strong bg-surface-sunken ${item.className}`}
              />
              <span className="font-mono text-2xs text-fg-subtle">{item.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        <div className="flex flex-col gap-2xs rounded-lg border border-border bg-surface p-md">
          {TEXT_SIZES.map((item) => (
            <div key={item.label} className="flex items-baseline gap-sm">
              <span className="w-12 shrink-0 font-mono text-2xs text-fg-subtle">{item.label}</span>
              <span className={item.className}>Daraja oshdi</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className="grid grid-cols-2 gap-lg sm:grid-cols-4">
          {SHADOWS.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2xs">
              <div className={`size-16 rounded-lg bg-surface ${item.className}`} />
              <span className="font-mono text-2xs text-fg-subtle">{item.label}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
