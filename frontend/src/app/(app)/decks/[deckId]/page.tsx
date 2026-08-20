import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DeckHeader } from "@/components/decks/deck-header";
import { CardList } from "@/components/cards/card-list";
import { StatsStrip } from "@/components/stats/stats-strip";
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
      <div className="flex flex-col gap-xl">
        <DeckHeader deck={deck} dueCount={dueCount} />
        <StatsStrip stats={stats} />
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
