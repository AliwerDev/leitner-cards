"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Kbd, Progress } from "@/components/ui";
import { useStudySession } from "./use-study-session";
import { StudyCard } from "./study-card";
import { StudySummary } from "./study-summary";
import { LevelChangeChip } from "./level-change-chip";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { refreshAfterSessionAction, resetCardAction } from "@/lib/actions/reviews";
import { deckAccentStyle } from "@/lib/domain/deck-color";
import { uz } from "@/lib/i18n/uz";
import type { DueCard } from "@/types/api";

const RULE_SEEN_KEY = "leitner-rule-seen";

export function StudySession({
  initialCards,
  deckId,
  deckName,
  deckColor,
  queueWasFull,
}: {
  initialCards: DueCard[];
  deckId?: number;
  deckName?: string;
  deckColor?: number | null;
  /** True when the queue came back full, so more cards may be waiting. */
  queueWasFull: boolean;
}) {
  const router = useRouter();
  const session = useStudySession(initialCards);
  const { state, currentCard } = session;

  const [showRule, setShowRule] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(RULE_SEEN_KEY)) setShowRule(true);
    } catch {
      // Blocked storage only costs the reminder.
    }
  }, []);

  const dismissRule = () => {
    setShowRule(false);
    try {
      localStorage.setItem(RULE_SEEN_KEY, "1");
    } catch {
      // Ignore.
    }
  };

  // Clear the level chip shortly after it appears.
  useEffect(() => {
    if (!state.feedback) return;
    const timer = setTimeout(() => session.clearFeedback(), 1400);
    return () => clearTimeout(timer);
  }, [state.feedback, session]);

  // Refresh badges and stats once the session is over, not per answer.
  useEffect(() => {
    if (state.phase === "summary") void refreshAfterSessionAction(deckId);
  }, [state.phase, deckId]);

  useHotkeys(
    {
      // Space only turns the card over, both ways. Answering needs 1 or 2, so a
      // second press cannot submit a card the user is still reading.
      " ": () => session.flip(),
      Enter: () => session.flip(),
      "1": () => session.answer(true),
      ArrowLeft: () => session.answer(true),
      "2": () => session.answer(false),
      ArrowRight: () => session.answer(false),
      r: () => currentCard && void resetCardAction(currentCard.id),
      R: () => currentCard && void resetCardAction(currentCard.id),
      Escape: () => router.push(deckId ? `/decks/${deckId}` : "/decks"),
    },
    state.phase !== "summary",
  );

  if (state.phase === "summary") {
    return (
      <StudySummary
        session={session}
        deckId={deckId}
        queueWasFull={queueWasFull}
        onRestart={() => router.refresh()}
      />
    );
  }

  if (!currentCard) return null;

  const total = state.queue.length;
  const done = state.index;

  return (
    <div
      // The session owns a full viewport column: the card takes the leftover
      // space and the buttons sit at the bottom, instead of both bunching up
      // under the progress bar. --shell-chrome-v is the dock plus its clearance
      // on a phone and the island plus its clearance on desktop, so this fits
      // either breakpoint.
      className="gap-lg mx-auto flex h-[calc(100dvh-var(--shell-chrome-v)-2*var(--space-lg))] w-full max-w-(--measure-2xl) flex-col"
      style={deckColor !== undefined ? deckAccentStyle(deckColor, deckId ?? 0) : undefined}
    >
      <div className="gap-2xs flex flex-col">
        <div className="gap-md flex items-center justify-between text-sm">
          <span className="text-fg-muted truncate">{deckName ?? uz.stats.allDecks}</span>
          <span className="text-fg-muted tabular-nums">{uz.study.progress(done, total)}</span>
        </div>
        <Progress value={done} max={total} label={uz.study.progress(done, total)} />
      </div>

      {showRule ? (
        <Alert tone="info" title={uz.study.ruleTitle} onDismiss={dismissRule}>
          {uz.study.ruleBody}
        </Alert>
      ) : null}

      <div className="relative min-h-0 flex-1">
        {state.feedback ? <LevelChangeChip feedback={state.feedback} /> : null}
        <StudyCard
          key={currentCard.id}
          prompt={currentCard.prompt}
          answer={currentCard.answer}
          flipped={state.phase === "revealed"}
          onFlip={session.flip}
        />
      </div>

      {state.phase === "prompt" ? (
        <Button size="lg" fullWidth onClick={session.reveal}>
          {uz.study.reveal} <Kbd className="ml-xs">Space</Kbd>
        </Button>
      ) : (
        <div className="gap-sm grid grid-cols-2">
          <Button
            size="lg"
            variant="outline"
            onClick={() => session.answer(false)}
            className="gap-3xs border-danger text-danger-text flex-col"
          >
            <span>{uz.study.wrong}</span>
          </Button>
          <Button
            size="lg"
            onClick={() => session.answer(true)}
            className="gap-3xs bg-success flex-col"
          >
            <span>{uz.study.correct}</span>
          </Button>
        </div>
      )}

      <div className="gap-md text-2xs text-fg-subtle flex flex-wrap items-center justify-center">
        <span className="gap-3xs flex items-center">
          <Kbd>Space</Kbd> {uz.study.shortcutReveal}
        </span>
        <span className="gap-3xs flex items-center">
          <Kbd>1</Kbd> {uz.study.shortcutCorrect}
        </span>
        <span className="gap-3xs flex items-center">
          <Kbd>2</Kbd> {uz.study.shortcutWrong}
        </span>
        <span className="gap-3xs flex items-center">
          <Kbd>Esc</Kbd> {uz.study.shortcutExit}
        </span>
      </div>
    </div>
  );
}
