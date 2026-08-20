import { levelLabel } from "@/lib/domain/level";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import type { Feedback } from "./use-study-session";

/**
 * States the actual transition, e.g. "6-daraja -> 1-daraja", so the
 * consequence of a wrong answer is concrete rather than abstract.
 */
export function LevelChangeChip({ feedback }: { feedback: Feedback }) {
  const { levelBefore, levelAfter, wasCorrect, mastered } = feedback;

  return (
    <div
      role="status"
      className={cn(
        "absolute -top-3 left-1/2 z-(--z-sticky) -translate-x-1/2",
        "flex items-center gap-2xs rounded-full px-sm py-3xs text-xs font-medium shadow-md",
        mastered
          ? "bg-mastered-subtle text-accent-text"
          : wasCorrect
            ? "bg-success-subtle text-success-text"
            : "bg-danger-subtle text-danger-text",
      )}
    >
      {mastered ? (
        <span>{uz.study.mastered} 🎉</span>
      ) : (
        <span>
          {levelLabel(levelBefore)} → {levelLabel(levelAfter)}
        </span>
      )}
    </div>
  );
}
