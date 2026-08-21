<?php

namespace app\services;

use app\enums\UserRole;
use app\enums\UserStatus;
use app\enums\UserType;
use app\models\Card;
use app\models\CardProgress;
use app\models\Deck;
use app\models\RefreshToken;
use app\models\ReviewHistory;
use app\models\User;
use Yii;
use yii\db\Expression;
use yii\db\Query;

/**
 * Account-wide aggregates for the admin dashboard.
 *
 * Separate from ReviewService on purpose: that class is the review engine for
 * one user and every method there takes a $userId. Nothing here is scoped to a
 * user, so mixing the two would leave a service where half the methods are
 * per-account and half are global.
 *
 * Each dimension is one grouped query rather than one COUNT per bucket, so the
 * dashboard stays a handful of queries as the enums grow.
 */
class AdminStatsService
{
    /** Window for the review trend, matching the user-facing daily series. */
    private const TREND_DAYS = 30;

    public function dashboard(?int $at = null): array
    {
        $at ??= time();

        return [
            'users' => $this->users($at),
            'content' => $this->content(),
            'reviews' => $this->reviews($at),
            'generated_at' => $at,
        ];
    }

    /**
     * User totals plus a histogram over type, role and status.
     */
    private function users(int $at): array
    {
        return [
            'total' => (int) User::find()->count(),
            // Anyone who can actually sign in. findIdentity() filters on
            // ACTIVE, so this is the only figure that means "reachable users".
            'active' => (int) User::find()
                ->where(['status' => UserStatus::ACTIVE->value])
                ->count(),
            'registered_30d' => (int) User::find()
                ->where(['>=', 'created_at', $at - self::TREND_DAYS * 86400])
                ->count(),
            'by_type' => $this->histogram('type', UserType::options()),
            'by_role' => $this->histogram('role', UserRole::options()),
            'by_status' => $this->histogram('status', UserStatus::options()),
        ];
    }

    /**
     * One GROUP BY over a user column, zero-filled from the enum's options.
     *
     * Returns a list rather than a value-keyed map: PHP serializes an empty
     * int-keyed array as [] and a populated one as an object, so a map would
     * change JSON type depending on the data. A list also carries the label,
     * which keeps the enum's Uzbek text in one place.
     *
     * @param array<int,string> $options value => label, from Enum::options()
     * @return list<array{value:int,label:string,count:int}>
     */
    private function histogram(string $column, array $options): array
    {
        $rows = (new Query())
            ->select([$column, 'total' => 'COUNT(*)'])
            ->from(User::tableName())
            ->groupBy($column)
            ->all(Yii::$app->db);

        $counts = [];

        foreach ($rows as $row) {
            $counts[(int) $row[$column]] = (int) $row['total'];
        }

        $result = [];

        foreach ($options as $value => $label) {
            $result[] = [
                'value' => $value,
                'label' => $label,
                // A bucket with no users must still appear, or the reader
                // cannot tell an empty tier from a broken query.
                'count' => $counts[$value] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * Deck and card totals, and how much of it is actually studied.
     */
    private function content(): array
    {
        return [
            'decks' => (int) Deck::find()->count(),
            'cards' => (int) Card::find()->count(),
            // Cards with a progress row: the first answer creates it, so this
            // is "cards anyone has ever studied".
            'cards_started' => (int) CardProgress::find()->count(),
            'empty_decks' => (int) (new Query())
                ->from(['d' => Deck::tableName()])
                ->leftJoin(['c' => Card::tableName()], 'c.deck_id = d.id')
                ->where(['c.id' => null])
                ->count('*', Yii::$app->db),
        ];
    }

    /**
     * Review volume over the trend window, account-wide.
     *
     * Same shape and the same zero fill as ReviewService::dailySeries(), so the
     * admin chart can reuse the components that draw the per-user one. Days are
     * UTC in both.
     */
    private function reviews(int $at): array
    {
        $todayStart = intdiv($at, 86400) * 86400;
        $since = $todayStart - (self::TREND_DAYS - 1) * 86400;

        $dayExpr = "to_char(to_timestamp(rh.reviewed_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD')";

        $rows = (new Query())
            ->select([
                'day' => $dayExpr,
                'reviews' => 'COUNT(*)',
                'correct' => 'SUM(CASE WHEN rh.was_correct THEN 1 ELSE 0 END)',
                'users' => 'COUNT(DISTINCT rh.user_id)',
            ])
            ->from(['rh' => ReviewHistory::tableName()])
            ->where(['>=', 'rh.reviewed_at', $since])
            ->groupBy(new Expression($dayExpr))
            ->all(Yii::$app->db);

        $byDay = [];

        foreach ($rows as $row) {
            $byDay[$row['day']] = $row;
        }

        $series = [];
        $total = 0;
        $correctTotal = 0;

        for ($offset = 0; $offset < self::TREND_DAYS; $offset++) {
            $day = gmdate('Y-m-d', $since + $offset * 86400);
            $reviews = (int) ($byDay[$day]['reviews'] ?? 0);
            $correct = (int) ($byDay[$day]['correct'] ?? 0);

            $total += $reviews;
            $correctTotal += $correct;

            $series[] = [
                'day' => $day,
                'reviews' => $reviews,
                'correct' => $correct,
                'users' => (int) ($byDay[$day]['users'] ?? 0),
                // Null, not 0, on an empty day: there is no accuracy to plot
                // and the line must break.
                'accuracy' => $reviews > 0 ? round($correct / $reviews, 2) : null,
            ];
        }

        return [
            'days' => self::TREND_DAYS,
            'total_30d' => $total,
            'accuracy_30d' => $total > 0 ? round($correctTotal / $total, 2) : null,
            // Distinct over the whole window, not the sum of the daily figures:
            // the same person studying on ten days is one active user.
            'active_users_30d' => (int) (new Query())
                ->from(ReviewHistory::tableName())
                ->where(['>=', 'reviewed_at', $since])
                ->count('DISTINCT user_id', Yii::$app->db),
            'series' => $series,
        ];
    }

    /**
     * Per-user counters for the admin detail screen.
     */
    public function userCounts(int $userId): array
    {
        return [
            'decks' => (int) Deck::find()->where(['user_id' => $userId])->count(),
            // card carries no user_id, so ownership has to reach the deck.
            'cards' => (int) (new Query())
                ->from(['c' => Card::tableName()])
                ->innerJoin(['d' => Deck::tableName()], 'd.id = c.deck_id')
                ->where(['d.user_id' => $userId])
                ->count('*', Yii::$app->db),
            'reviews' => (int) ReviewHistory::find()->where(['user_id' => $userId])->count(),
            'active_sessions' => (int) RefreshToken::find()
                ->where(['user_id' => $userId, 'revoked_at' => null])
                ->andWhere(['>', 'expires_at', time()])
                ->count(),
        ];
    }
}
