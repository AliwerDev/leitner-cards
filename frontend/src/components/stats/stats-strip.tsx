import { Stat } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import type { Stats } from "@/types/api";

/**
 * The four headline numbers.
 *
 * The deck page leads with the level board, so it passes `compact` to make
 * these secondary. The stats page keeps the full size, where they lead.
 */
export function StatsStrip({ stats, compact = false }: { stats: Stats; compact?: boolean }) {
  const itemClass = compact ? "p-sm [&>p]:text-base" : undefined;

  return (
    <div className={cn("gap-sm grid", compact ? "grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4")}>
      <Stat label={uz.stats.totalCards} value={stats.total_cards} className={itemClass} />
      <Stat
        label={uz.stats.dueNow}
        value={stats.due_now}
        tone={stats.due_now > 0 ? "warning" : "neutral"}
        className={itemClass}
      />
      <Stat label={uz.stats.mastered} value={stats.mastered} tone="success" className={itemClass} />
      <Stat label={uz.stats.notStarted} value={stats.not_started} className={itemClass} />
    </div>
  );
}
