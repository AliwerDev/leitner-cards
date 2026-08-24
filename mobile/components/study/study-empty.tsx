import { CircleCheckBig } from "lucide-react-native";
import { EmptyState } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

/** Matches NAV_ICON_STROKE on the web. */
const ICON_STROKE = 1.75;
const ICON_SIZE = 48;

/**
 * "Nothing is due" - the end of a queue, and the state every study route
 * lands in once the deck is caught up.
 *
 * It is one component rather than three EmptyState calls because the three
 * routes that show it (/study, /study/[deckId], and the session itself when
 * the queue runs dry) have to say the same thing with the same icon.
 *
 * The tick is success-toned, not muted: an empty queue is the goal, not a
 * missing thing.
 */
export function StudyEmpty() {
  const { colors } = useTheme();

  return (
    <EmptyState
      icon={
        <CircleCheckBig color={colors.successText} size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      }
      title={uz.study.empty}
      body={uz.study.emptyHint}
    />
  );
}
