import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StudySession } from "@/components/study/study-session";
import { getDeck } from "@/lib/api/endpoints/decks";
import { getDueCards, DEFAULT_DUE_LIMIT } from "@/lib/api/endpoints/reviews";
import { ApiError } from "@/lib/api/error";
import { uz } from "@/lib/i18n/uz";

type PageProps = { params: Promise<{ deckId: string }> };

export const metadata: Metadata = { title: uz.study.title };

export default async function DeckStudyPage({ params }: PageProps) {
  const { deckId: deckIdRaw } = await params;
  const deckId = Number(deckIdRaw);
  if (!Number.isInteger(deckId) || deckId < 1) notFound();

  try {
    const [deck, due] = await Promise.all([
      getDeck(deckId),
      getDueCards({ deckId, limit: DEFAULT_DUE_LIMIT }),
    ]);

    return (
      <StudySession
        initialCards={due.cards}
        deckId={deck.id}
        deckName={deck.name}
        deckColor={deck.color}
        queueWasFull={due.cards.length >= DEFAULT_DUE_LIMIT}
      />
    );
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
}
