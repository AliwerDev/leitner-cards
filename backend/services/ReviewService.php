<?php

namespace app\services;

use app\enums\CardLevel;
use app\models\Card;
use app\models\CardProgress;
use app\models\Deck;
use app\models\ReviewHistory;
use Yii;
use yii\db\ActiveQuery;
use yii\db\Expression;
use yii\db\IntegrityException;
use yii\db\Query;
use yii\web\NotFoundHttpException;
use yii\web\ServerErrorHttpException;

/**
 * The Leitner review engine: what to study now, and what happens to a card
 * when it is answered.
 *
 * Scheduling arithmetic lives in CardLevel (a pure function of level + time);
 * this service owns everything impure - queries, transactions, row creation.
 */
class ReviewService
{
    /**
     * Cards the user should study now, earliest schedule first.
     *
     * Two sets are unioned: cards whose progress row is due, and cards with no
     * progress row at all (never studied, so due immediately). Mastered cards
     * have a NULL next_review_at and fail both branches, so they never appear.
     *
     * Progress rows are NOT created here - a GET must not write. The real row
     * is created on the first recordAnswer() call.
     *
     * @return Card[] each with the `progress` relation populated (or null)
     */
    public function dueCards(int $userId, ?int $deckId = null, int $limit = 20, ?int $at = null): array
    {
        $at ??= time();

        // Eager-load progress for THIS $userId rather than via Card::getProgress(),
        // which reads the logged-in identity and would be wrong when the service
        // is called for another user (console command, admin path).
        return $this->dueQuery($userId, $deckId, $at)
            ->with([
                'progresses' => fn(ActiveQuery $q) => $q->andWhere(['user_id' => $userId]),
            ])
            ->orderBy(['p.next_review_at' => SORT_ASC, 'c.id' => SORT_ASC])
            ->limit($limit)
            ->all();
    }

    /**
     * The progress row for one card out of a dueCards() result, or null when the
     * card has never been studied.
     */
    public function progressOf(Card $card): ?CardProgress
    {
        return $card->progresses[0] ?? null;
    }

    /**
     * How many cards are waiting, without fetching them.
     */
    public function dueCount(int $userId, ?int $deckId = null, ?int $at = null): int
    {
        return (int) $this->dueQuery($userId, $deckId, $at ?? time())->count();
    }

    /**
     * Records one answer: moves the card a level up or down, reschedules it,
     * and appends a history row. Atomic - either both happen or neither.
     *
     * @throws \yii\web\NotFoundHttpException if the card is not in a deck the user owns
     */
    public function recordAnswer(int $userId, int $cardId, bool $wasCorrect, ?int $at = null): ReviewResult
    {
        $at ??= time();
        $card = Card::findOwned($cardId, $userId);

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $progress = $this->progressFor($userId, $card, $at);

            $before = $progress->getLevel();
            $after = $before->next($wasCorrect);

            $progress->setLevel($after);
            $progress->last_reviewed_at = $at;
            // NULL when mastered: nothing more is scheduled.
            $progress->next_review_at = $after->nextReviewAt($at);

            if (!$progress->save()) {
                throw new ServerErrorHttpException('Progressni saqlash muvaffaqiyatsiz tugadi.');
            }

            $history = new ReviewHistory([
                'user_id' => $userId,
                'card_id' => $card->id,
                'level_before' => $before->value,
                'level_after' => $after->value,
                'was_correct' => $wasCorrect,
                'reviewed_at' => $at,
            ]);

            if (!$history->save()) {
                throw new ServerErrorHttpException('Takrorlash tarixini saqlash muvaffaqiyatsiz tugadi.');
            }

            $transaction->commit();
        } catch (\Throwable $e) {
            $transaction->rollBack();

            throw $e;
        }

        return new ReviewResult($progress, $history, $before, $after, $wasCorrect);
    }

    /**
     * Get-or-create the progress row for a card, at the first level and due now.
     *
     * Locks an existing row FOR UPDATE so concurrent answers to the same card
     * serialise instead of both reading a stale level. On a lost insert race
     * the unique index rejects the second write and we re-read the winner.
     *
     * Callers that mutate the row must already be inside a transaction.
     */
    public function progressFor(int $userId, Card $card, ?int $at = null): CardProgress
    {
        $at ??= time();

        $progress = $this->lockProgress($userId, $card->id);

        if ($progress !== null) {
            return $progress;
        }

        $level = CardLevel::first();

        $progress = new CardProgress([
            'user_id' => $userId,
            'card_id' => $card->id,
            'current_level' => $level->value,
            'last_reviewed_at' => null,
            'next_review_at' => $level->nextReviewAt($at),
        ]);

        try {
            if (!$progress->save()) {
                throw new ServerErrorHttpException('Progress yaratish muvaffaqiyatsiz tugadi.');
            }
        } catch (IntegrityException) {
            // A concurrent request inserted it first - use their row.
            $progress = $this->lockProgress($userId, $card->id);

            if ($progress === null) {
                throw new ServerErrorHttpException('Progressni o\'qish muvaffaqiyatsiz tugadi.');
            }
        }

        return $progress;
    }

    /**
     * Sends a card back to the first level, due immediately ("I forgot this").
     * Writes no history - nothing was actually reviewed.
     */
    public function resetCard(int $userId, int $cardId, ?int $at = null): CardProgress
    {
        $at ??= time();
        $card = Card::findOwned($cardId, $userId);

        $transaction = Yii::$app->db->beginTransaction();

        try {
            $progress = $this->progressFor($userId, $card, $at);
            $level = CardLevel::first();

            $progress->setLevel($level);
            $progress->next_review_at = $level->nextReviewAt($at);

            if (!$progress->save()) {
                throw new ServerErrorHttpException('Progressni saqlash muvaffaqiyatsiz tugadi.');
            }

            $transaction->commit();
        } catch (\Throwable $e) {
            $transaction->rollBack();

            throw $e;
        }

        return $progress;
    }

    /**
     * Dashboard aggregates for one user, optionally scoped to a single deck.
     */
    public function stats(int $userId, ?int $deckId = null, ?int $at = null): array
    {
        $at ??= time();

        if ($deckId !== null) {
            $this->assertDeckOwned($userId, $deckId);
        }

        $ownedCards = (new Query())
            ->select('c.id')
            ->from(['c' => Card::tableName()])
            ->innerJoin(['d' => Deck::tableName()], 'd.id = c.deck_id')
            ->andWhere(['d.user_id' => $userId]);

        if ($deckId !== null) {
            $ownedCards->andWhere(['c.deck_id' => $deckId]);
        }

        $totalCards = (int) $ownedCards->count('*', Yii::$app->db);

        // Level histogram over cards studied at least once.
        $levelRows = (new Query())
            ->select(['current_level', 'total' => 'COUNT(*)'])
            ->from(['p' => CardProgress::tableName()])
            ->andWhere(['p.user_id' => $userId])
            ->andWhere(['p.card_id' => $ownedCards])
            ->groupBy('current_level')
            ->all(Yii::$app->db);

        $counts = [];

        foreach ($levelRows as $row) {
            $counts[(int) $row['current_level']] = (int) $row['total'];
        }

        $started = array_sum($counts);

        /*
         * A card gets its progress row on the first answer, so a new card has
         * no row at all. It still sits on the first rung of the ladder, and it
         * is due right away, so the histogram counts it there. Without this
         * every level except the studied ones reads zero, and the buckets do
         * not add up to total_cards.
         */
        $counts[CardLevel::first()->value] =
            ($counts[CardLevel::first()->value] ?? 0) + max(0, $totalCards - $started);

        $byLevel = [];

        foreach (CardLevel::cases() as $level) {
            $byLevel[] = [
                'level' => $level->value,
                'label' => $level->label(),
                'count' => $counts[$level->value] ?? 0,
            ];
        }

        $mastered = $counts[CardLevel::Mastered->value] ?? 0;

        $dayStart = $at - 86400;
        $weekStart = $at - 7 * 86400;

        $reviewsToday = (int) ReviewHistory::find()
            ->andWhere(['user_id' => $userId])
            ->andWhere(['>=', 'reviewed_at', $dayStart])
            ->count();

        $weekTotal = (int) ReviewHistory::find()
            ->andWhere(['user_id' => $userId])
            ->andWhere(['>=', 'reviewed_at', $weekStart])
            ->count();

        $weekCorrect = (int) ReviewHistory::find()
            ->andWhere(['user_id' => $userId])
            ->andWhere(['>=', 'reviewed_at', $weekStart])
            ->andWhere(['was_correct' => true])
            ->count();

        return [
            'total_cards' => $totalCards,
            'due_now' => $this->dueCount($userId, $deckId, $at),
            'mastered' => $mastered,
            'not_started' => max(0, $totalCards - $started),
            'by_level' => $byLevel,
            'reviews_today' => $reviewsToday,
            'accuracy_7d' => $weekTotal > 0 ? round($weekCorrect / $weekTotal, 2) : null,
        ];
    }

    /** Widest window the daily series will report, to bound the query cost. */
    private const DAILY_MAX_DAYS = 365;

    /**
     * Reviews per calendar day, oldest first, for charting a trend.
     *
     * Every day in the window is present, including the ones with no reviews:
     * a chart that silently omits empty days draws a continuous line over a
     * gap and overstates the streak. The zero fill happens here rather than in
     * the client so that every caller gets the same shape.
     *
     * Days are UTC. The rolling windows in stats() are second arithmetic and do
     * not align to a calendar, so the two do not have to agree exactly.
     *
     * @return list<array{day: string, reviews: int, correct: int, accuracy: float|null}>
     */
    public function dailySeries(int $userId, int $days = 30, ?int $deckId = null, ?int $at = null): array
    {
        $at ??= time();
        $days = max(1, min($days, self::DAILY_MAX_DAYS));

        if ($deckId !== null) {
            $this->assertDeckOwned($userId, $deckId);
        }

        // Midnight UTC of the first day in the window, so the oldest bucket is
        // a whole day rather than a partial one.
        $todayStart = intdiv($at, 86400) * 86400;
        $since = $todayStart - ($days - 1) * 86400;

        $query = (new Query())
            ->select([
                'day' => "to_char(to_timestamp(rh.reviewed_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
                'reviews' => 'COUNT(*)',
                'correct' => 'SUM(CASE WHEN rh.was_correct THEN 1 ELSE 0 END)',
            ])
            ->from(['rh' => ReviewHistory::tableName()])
            // Matches idx-review_history-user_id-reviewed_at.
            ->andWhere(['rh.user_id' => $userId])
            ->andWhere(['>=', 'rh.reviewed_at', $since]);

        // review_history carries no deck_id, so scoping has to reach the deck
        // through the card.
        if ($deckId !== null) {
            $query
                ->innerJoin(['c' => Card::tableName()], 'c.id = rh.card_id')
                ->andWhere(['c.deck_id' => $deckId]);
        }

        $rows = $query
            ->groupBy(new Expression("to_char(to_timestamp(rh.reviewed_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD')"))
            ->all(Yii::$app->db);

        $byDay = [];

        foreach ($rows as $row) {
            $byDay[$row['day']] = [
                'reviews' => (int) $row['reviews'],
                'correct' => (int) $row['correct'],
            ];
        }

        $series = [];

        for ($offset = 0; $offset < $days; $offset++) {
            $day = gmdate('Y-m-d', $since + $offset * 86400);
            $reviews = $byDay[$day]['reviews'] ?? 0;
            $correct = $byDay[$day]['correct'] ?? 0;

            $series[] = [
                'day' => $day,
                'reviews' => $reviews,
                'correct' => $correct,
                // Null rather than 0 on an empty day: nothing was answered, so
                // there is no accuracy to plot and the line must break.
                'accuracy' => $reviews > 0 ? round($correct / $reviews, 2) : null,
            ];
        }

        return $series;
    }

    /**
     * Shared base query for the due-cards set. Left-joins progress so that
     * never-studied cards survive the join.
     */
    private function dueQuery(int $userId, ?int $deckId, int $at): ActiveQuery
    {
        if ($deckId !== null) {
            $this->assertDeckOwned($userId, $deckId);
        }

        $query = Card::find()
            ->alias('c')
            ->innerJoin(
                ['d' => Deck::tableName()],
                'd.id = c.deck_id AND d.user_id = :uid',
                [':uid' => $userId]
            )
            ->leftJoin(
                ['p' => CardProgress::tableName()],
                'p.card_id = c.id AND p.user_id = :uid'
            )
            ->andWhere([
                'or',
                ['p.id' => null],
                ['<=', 'p.next_review_at', $at],
            ]);

        if ($deckId !== null) {
            $query->andWhere(['c.deck_id' => $deckId]);
        }

        return $query;
    }

    /**
     * Ownership check against an explicit user id.
     *
     * Deck::findDeck() reads Yii::$app->user, which is fine in a controller but
     * wrong here: the service takes $userId as a parameter and must also work
     * outside a web request (console commands, jobs).
     *
     * @throws NotFoundHttpException when the deck is missing or owned by someone else
     */
    private function assertDeckOwned(int $userId, int $deckId): void
    {
        $exists = Deck::find()
            ->andWhere(['id' => $deckId, 'user_id' => $userId])
            ->exists();

        if (!$exists) {
            throw new NotFoundHttpException('Deck topilmadi yoki ruxsat yo\'q.');
        }
    }

    /**
     * SELECT ... FOR UPDATE on one progress row, or null when absent.
     *
     * Yii's ActiveQuery has no locking clause, so the statement is issued
     * directly. Only meaningful inside a transaction.
     */
    private function lockProgress(int $userId, int $cardId): ?CardProgress
    {
        $table = Yii::$app->db->quoteTableName(CardProgress::tableName());

        return CardProgress::findBySql(
            "SELECT * FROM {$table} WHERE user_id = :uid AND card_id = :cid FOR UPDATE",
            [':uid' => $userId, ':cid' => $cardId]
        )->one();
    }
}
