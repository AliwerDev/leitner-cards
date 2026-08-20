import type { Metadata } from "next";
import { StudySession } from "@/components/study/study-session";
import { getDueCards, DEFAULT_DUE_LIMIT } from "@/lib/api/endpoints/reviews";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.study.title };

/** Study across every deck. */
export default async function StudyPage() {
  const { cards } = await getDueCards({ limit: DEFAULT_DUE_LIMIT });

  return (
    <StudySession initialCards={cards} queueWasFull={cards.length >= DEFAULT_DUE_LIMIT} />
  );
}
