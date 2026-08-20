"use client";

import Link from "next/link";
import { Alert, Button, Card, EmptyState, Stat } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";
import type { useStudySession } from "./use-study-session";

export function StudySummary({
  session,
  deckId,
  queueWasFull,
  onRestart,
}: {
  session: ReturnType<typeof useStudySession>;
  deckId?: number;
  queueWasFull: boolean;
  onRestart: () => void;
}) {
  const { state, correctCount, wrongCount, masteredCount } = session;
  const total = state.answers.length;

  if (total === 0) {
    return (
      <EmptyState
        icon="✅"
        title={uz.study.empty}
        description={uz.study.emptyHint}
        action={
          <Link href={deckId ? `/decks/${deckId}` : "/decks"}>
            <Button variant="outline">{uz.study.backToDeck}</Button>
          </Link>
        }
      />
    );
  }

  const accuracy = Math.round((correctCount / total) * 100);

  return (
    <div className="mx-auto flex w-full max-w-(--measure-2xl) flex-col gap-lg">
      <div className="flex flex-col gap-3xs text-center">
        <h1 className="text-2xl">{uz.study.summaryTitle}</h1>
        {queueWasFull ? <p className="text-sm text-fg-muted">{uz.study.summaryMoreLeft}</p> : null}
      </div>

      {state.failed.length > 0 ? (
        <Alert tone="warning" title={uz.study.unsavedAnswers(state.failed.length)}>
          <Button size="sm" variant="outline" onClick={() => void session.retryFailed()}>
            {uz.study.resendAnswers}
          </Button>
        </Alert>
      ) : null}

      <div className="grid gap-sm sm:grid-cols-4">
        <Stat label={uz.study.summaryTotal} value={total} />
        <Stat label={uz.study.summaryCorrect} value={correctCount} tone="success" />
        <Stat label={uz.study.summaryWrong} value={wrongCount} tone="danger" />
        <Stat label={uz.study.summaryAccuracy} value={`${accuracy}%`} tone="accent" />
      </div>

      {masteredCount > 0 ? (
        <Card variant="outlined">
          <p className="text-sm text-fg">
            {uz.study.summaryMastered}: <strong>{masteredCount}</strong> 🎉
          </p>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-center gap-xs">
        {queueWasFull ? <Button onClick={onRestart}>{uz.study.summaryAgain}</Button> : null}
        <Link href={deckId ? `/decks/${deckId}` : "/decks"}>
          <Button variant="outline">{uz.study.backToDeck}</Button>
        </Link>
        <Link href="/stats">
          <Button variant="ghost">{uz.stats.title}</Button>
        </Link>
      </div>
    </div>
  );
}
