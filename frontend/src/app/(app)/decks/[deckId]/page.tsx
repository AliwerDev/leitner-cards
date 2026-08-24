import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { DeckHeader } from "@/components/decks/deck-header";
import { CardList } from "@/components/cards/card-list";
import { StatsStrip } from "@/components/stats/stats-strip";
import { LevelBoard } from "@/components/stats/level-board";
import { Button } from "@/components/ui";
import { deckAccentStyle } from "@/lib/domain/deck-color";
import { getDeckStats } from "@/lib/api/endpoints/decks";
import { listCards } from "@/lib/api/endpoints/cards";
import { getDueCount } from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { uz } from "@/lib/i18n/uz";

type PageProps = {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { deckId } = await params;
  try {
    const { deck } = await getDeckStats(Number(deckId));
    return { title: deck.name };
  } catch {
    return { title: uz.errors.deckNotFound };
  }
}

export default async function DeckDetailPage({ params, searchParams }: PageProps) {
  const { deckId: deckIdRaw } = await params;
  const { q = "", page: pageRaw } = await searchParams;

  const deckId = Number(deckIdRaw);
  if (!Number.isInteger(deckId) || deckId < 1) notFound();

  const page = Math.max(Number(pageRaw) || 1, 1);

  try {
    // The deck, its stats, its cards and the due count are independent.
    const [{ deck, stats }, cards, dueCount] = await Promise.all([
      getDeckStats(deckId),
      listCards({ deckId, q: q || undefined, page }),
      getDueCount(deckId)
        .then((result) => result.due_count)
        .catch(() => 0),
    ]);

    return (
      <div className="gap-xl flex flex-col" style={deckAccentStyle(deck.color, deck.id)}>
        <DeckHeader deck={deck} dueCount={dueCount} />

        <div className="gap-md flex flex-col">
          <LevelBoard buckets={stats.by_level} />

          <StudyAction deckId={deckId} totalCards={stats.total_cards} dueCount={dueCount} />
        </div>

        <StatsStrip stats={stats} compact />

        <CardList
          deckId={deckId}
          cards={cards.items}
          totalCount={cards.pagination.totalCount}
          currentPage={cards.pagination.currentPage}
          pageCount={cards.pagination.pageCount}
          query={q}
        />
      </div>
    );
  } catch (error) {
    // 404 covers both "missing" and "owned by someone else".
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
}

/**
 * The button that starts a session.
 *
 * An empty deck gets nothing - the card list below already says the deck is
 * empty. A deck with cards but nothing due keeps the button in place so the
 * layout does not shift, but the button is inert and says why: sending the user
 * to the study page would only show them an empty queue.
 *
 * The disabled case renders no Link. `disabled` stops the button from taking
 * the click, but an anchor wrapped around it would still navigate.
 */
function StudyAction({
  deckId,
  totalCards,
  dueCount,
}: {
  deckId: number;
  totalCards: number;
  dueCount: number;
}) {
  if (totalCards === 0) return null;

  if (dueCount === 0) {
    return (
      <Button size="lg" fullWidth disabled>
        {uz.deck.noDue}
      </Button>
    );
  }

  return (
    <Link href={`/decks/${deckId}/study`} className="block">
      <Button size="lg" fullWidth>
        {uz.deck.studyCards(dueCount)}
      </Button>
    </Link>
  );
}
