import { Stat } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";
import type { Stats } from "@/types/api";

export function StatsStrip({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
      <Stat label={uz.stats.totalCards} value={stats.total_cards} />
      <Stat label={uz.stats.dueNow} value={stats.due_now} tone={stats.due_now > 0 ? "warning" : "neutral"} />
      <Stat label={uz.stats.mastered} value={stats.mastered} tone="success" />
      <Stat label={uz.stats.notStarted} value={stats.not_started} />
    </div>
  );
}
