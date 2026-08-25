<?php

namespace app\modules\api\v1\models;

use yii\base\Model;

/**
 * Body of POST /api/v1/reviews, and of one item inside POST /reviews/batch.
 *
 * `reviewedAt` and `clientId` are both optional and both exist for the same
 * caller: a mobile client flushing answers it recorded while offline. The web
 * sends neither and behaves exactly as it did before they existed.
 *
 * WHY A CLIENT TIMESTAMP IS HONOURED. A card answered correctly offline three
 * days ago at level 4 - a seven-day interval - becomes due in FOUR days, not
 * seven. That is the right answer. The Leitner interval measures time since
 * the card was actually recalled, not time since a packet reached a server.
 * Computing next_review_at from time() at flush would hand the user a free
 * three-day extension bought by being on a train, and the schedule would
 * drift longer after every offline session - which defeats the point of the
 * ladder, where the interval IS the memory claim being tested.
 */
class ReviewForm extends Model
{
    public $cardId;
    public $wasCorrect;
    public $reviewedAt;
    public $clientId;

    /**
     * How far back a client-supplied timestamp may reach.
     *
     * Matched to MAX_AGE_MS in mobile/lib/utils/pending-reviews.ts: the outbox
     * drops anything older than seven days, so the server never has a
     * legitimate reason to accept one. Anything older is a device with a badly
     * wrong clock or a replay, and honouring it would write a review_history
     * row into a week that stats have already reported on.
     */
    private const MAX_AGE_SECONDS = 7 * 86400;

    /**
     * Tolerance for a device clock running fast.
     *
     * A phone a few minutes ahead is ordinary. Rejecting it would lose a real
     * answer over a skew the user cannot see or fix.
     */
    private const FUTURE_SKEW_SECONDS = 300;

    public function rules(): array
    {
        return [
            [['cardId', 'wasCorrect'], 'required'],
            [['cardId'], 'integer', 'min' => 1],
            [['wasCorrect'], 'boolean'],
            [['reviewedAt'], 'integer', 'min' => 1],
            [['reviewedAt'], 'validateReviewedAt'],
            [['clientId'], 'string', 'max' => 64],
        ];
    }

    public function attributeLabels(): array
    {
        return [
            'cardId' => 'Karta',
            'wasCorrect' => 'Javob to\'g\'ri',
            'reviewedAt' => 'Javob vaqti',
            'clientId' => 'Mijoz identifikatori',
        ];
    }

    /**
     * Too-old is rejected rather than clamped.
     *
     * Note the asymmetry against reviewedAt() below, which clamps a future
     * time instead of rejecting it. Clamping forward is lossless in schedule
     * terms; clamping a three-week-old answer to now would reschedule the card
     * off a moment that never happened.
     */
    public function validateReviewedAt(string $attribute): void
    {
        if ($this->isBlank($this->$attribute)) {
            return;
        }

        if ((int) $this->$attribute < time() - self::MAX_AGE_SECONDS) {
            $this->addError($attribute, 'Javob vaqti juda eski.');
        }
    }

    public function cardId(): int
    {
        return (int) $this->cardId;
    }

    /** The boolean validator accepts "1"/"true"/0 - normalise before use. */
    public function isCorrect(): bool
    {
        return filter_var($this->wasCorrect, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * The effective answer time, or null to let the service use its own clock.
     *
     * A future timestamp is CLAMPED to now rather than rejected: throwing away
     * a real answer because a phone's clock is wrong is worse than a value
     * that is never further off than the current behaviour of ignoring the
     * client's time entirely.
     */
    public function reviewedAt(): ?int
    {
        if ($this->isBlank($this->reviewedAt)) {
            return null;
        }

        return min((int) $this->reviewedAt, time() + self::FUTURE_SKEW_SECONDS);
    }

    public function clientId(): ?string
    {
        $value = is_string($this->clientId) ? trim($this->clientId) : '';

        return $value === '' ? null : $value;
    }

    /**
     * An absent optional field arrives as null from a JSON body and as an
     * empty string from a form-encoded one. Both mean "not supplied".
     */
    private function isBlank(mixed $value): bool
    {
        return $value === null || $value === '';
    }
}
