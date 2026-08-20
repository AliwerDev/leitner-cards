"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Kbd, Progress } from "@/components/ui";
import { useStudySession } from "./use-study-session";
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
      " ": () => (state.phase === "prompt" ? session.reveal() : session.answer(true)),
      Enter: () => (state.phase === "prompt" ? session.reveal() : session.answer(true)),
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
      className="mx-auto flex w-full max-w-(--measure-2xl) flex-col gap-lg"
      style={deckColor !== undefined ? deckAccentStyle(deckColor, deckId ?? 0) : undefined}
    >
      <div className="flex flex-col gap-2xs">
        <div className="flex items-center justify-between gap-md text-sm">
          <span className="truncate text-fg-muted">{deckName ?? uz.stats.allDecks}</span>
          <span className="tabular-nums text-fg-muted">{uz.study.progress(done, total)}</span>
        </div>
        {/* Driven by the client queue, not the API's account-wide due_count. */}
        <Progress value={done} max={total} label={uz.study.progress(done, total)} />
      </div>

      {showRule ? (
        <Alert tone="info" title={uz.study.ruleTitle} onDismiss={dismissRule}>
          {uz.study.ruleBody}
        </Alert>
      ) : null}

      <div className="relative">
        {state.feedback ? <LevelChangeChip feedback={state.feedback} /> : null}

        <div
          className="flex flex-col items-center justify-center gap-lg rounded-xl border border-border bg-surface p-xl text-center"
          style={{ minHeight: "var(--study-card-min-height)" }}
        >
          {/* prompt/answer are resolved server-side for the deck direction. */}
          <p className="text-2xl leading-tight font-medium text-fg">{currentCard.prompt}</p>

          {state.phase === "revealed" ? (
            <>
              <div className="h-px w-16 bg-border" />
              <p className="text-xl text-fg-muted">{currentCard.answer}</p>
            </>
          ) : null}
        </div>
      </div>

      {state.phase === "prompt" ? (
        <Button size="lg" fullWidth onClick={session.reveal}>
          {uz.study.reveal} <Kbd className="ml-xs">Space</Kbd>
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-sm">
          <Button
            size="lg"
            variant="outline"
            onClick={() => session.answer(false)}
            className="flex-col gap-3xs border-danger text-danger-text"
          >
            <span>{uz.study.wrong}</span>
            {/* Visible before the click, not a tooltip: losing level 6 without
                warning feels like a bug. */}
            <span className="text-2xs font-normal opacity-80">{uz.study.wrongHint}</span>
          </Button>
          <Button
            size="lg"
            onClick={() => session.answer(true)}
            className="flex-col gap-3xs bg-success"
          >
            <span>{uz.study.correct}</span>
            <span className="text-2xs font-normal opacity-80">&nbsp;</span>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-md text-2xs text-fg-subtle">
        <span className="flex items-center gap-3xs">
          <Kbd>Space</Kbd> {uz.study.shortcutReveal}
        </span>
        <span className="flex items-center gap-3xs">
          <Kbd>1</Kbd> {uz.study.shortcutCorrect}
        </span>
        <span className="flex items-center gap-3xs">
          <Kbd>2</Kbd> {uz.study.shortcutWrong}
        </span>
        <span className="flex items-center gap-3xs">
          <Kbd>Esc</Kbd> {uz.study.shortcutExit}
        </span>
      </div>
    </div>
  );
}
