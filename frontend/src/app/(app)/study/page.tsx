import type { Metadata } from "next";
import { StudySession } from "@/components/study/study-session";
import { getDueCards, ALL_DUE_CAP } from "@/lib/api/endpoints/reviews";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.study.title };

/**
 * Study across every deck.
 *
 * The queue is every card that is ready. The server caps a single response, so
 * `queueWasFull` tells the summary that more cards may be waiting behind it.
 */
export default async function StudyPage() {
  const { cards, count } = await getDueCards();

  return <StudySession initialCards={cards} queueWasFull={count >= ALL_DUE_CAP} />;
}
