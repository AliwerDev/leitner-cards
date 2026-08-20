import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";

/**
 * The backend answers 404 both for a missing deck and for one owned by someone
 * else. The copy must not distinguish them - saying "no permission" would
 * confirm the deck exists and turn this into an enumeration oracle.
 */
export default function DeckNotFound() {
  return (
    <EmptyState
      icon="🔍"
      title={uz.errors.deckNotFound}
      action={
        <Link href="/decks">
          <Button variant="outline">{uz.common.back}</Button>
        </Link>
      }
    />
  );
}
