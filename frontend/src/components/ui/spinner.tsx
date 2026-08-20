import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

export type SpinnerProps = {
  size?: keyof typeof SIZES;
  /** Visually hidden label. Omit inside a button that already has text. */
  label?: string;
  className?: string;
};

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex", className)}>
      <svg
        className={cn("animate-spin", SIZES[size])}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
