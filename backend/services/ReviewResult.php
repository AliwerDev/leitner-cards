<?php

namespace app\services;

use app\enums\CardLevel;
use app\models\CardProgress;
use app\models\ReviewHistory;

/**
 * Outcome of a single recorded answer.
 */
final class ReviewResult
{
    public function __construct(
        public readonly CardProgress $progress,
        public readonly ReviewHistory $history,
        public readonly CardLevel $levelBefore,
        public readonly CardLevel $levelAfter,
        public readonly bool $wasCorrect,
        /**
         * True when this answer had already been recorded and was recognised
         * by its client id rather than applied a second time.
         *
         * Last and defaulted so the ordinary path constructs a result exactly
         * as it always did.
         */
        public readonly bool $duplicate = false,
    ) {
    }

    public function isMastered(): bool
    {
        return $this->levelAfter->isMastered();
    }

    public function wasPromoted(): bool
    {
        return $this->levelAfter->value > $this->levelBefore->value;
    }
}
