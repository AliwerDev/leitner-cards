import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Crumb = { href: string; label: string };

/**
 * The page title block. With the topbar gone, this is what tells the user where
 * they are, so every route renders one instead of hand-rolling the same stack of
 * heading and subtitle.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
  accessory,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: readonly Crumb[];
  /** Primary control, right-aligned on one line with the title. */
  action?: React.ReactNode;
  /** Extra row under the subtitle, for badges or filters. */
  accessory?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("gap-md flex flex-wrap items-start justify-between", className)}>
      <div className="gap-3xs flex min-w-0 flex-col">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav aria-label="breadcrumb" className="gap-2xs text-2xs text-fg-subtle flex items-center">
            {breadcrumb.map((crumb) => (
              <span key={crumb.href} className="gap-2xs flex items-center">
                <Link
                  href={crumb.href}
                  className="hover:text-fg transition-colors duration-(--duration-fast) ease-out"
                >
                  {crumb.label}
                </Link>
                <span aria-hidden="true">/</span>
              </span>
            ))}
          </nav>
        ) : null}

        {typeof title === "string" ? (
          <h1 className="truncate text-2xl">{title}</h1>
        ) : (
          <h1 className="text-2xl">{title}</h1>
        )}

        {subtitle ? <p className="text-fg-muted text-sm">{subtitle}</p> : null}

        {accessory}
      </div>

      {action ? <div className="gap-xs flex shrink-0 items-center">{action}</div> : null}
    </div>
  );
}
