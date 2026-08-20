<?php

namespace app\enums;

enum CardLevel: int
{
    case Level1 = 1;
    case Level2 = 2;
    case Level3 = 3;
    case Level4 = 4;
    case Level5 = 5;
    case Level6 = 6;
    case Level7 = 7;
    case Mastered = 8;

    /** Leitner interval per level. NULL means no further review is scheduled. */
    public function intervalDays(): ?int
    {
        return match ($this) {
            self::Level1 => 0,
            self::Level2 => 2,
            self::Level3 => 3,
            self::Level4 => 7,
            self::Level5 => 15,
            self::Level6 => 31,
            self::Level7 => 61,
            self::Mastered => null,
        };
    }

    public function intervalSeconds(): ?int
    {
        $days = $this->intervalDays();

        return $days === null ? null : $days * 86400;
    }

    public function label(): string
    {
        return match ($this) {
            self::Level1 => '1-daraja',
            self::Level2 => '2-daraja',
            self::Level3 => '3-daraja',
            self::Level4 => '4-daraja',
            self::Level5 => '5-daraja',
            self::Level6 => '6-daraja',
            self::Level7 => '7-daraja',
            self::Mastered => 'O\'zlashtirilgan',
        };
    }

    public static function first(): self
    {
        return self::Level1;
    }

    public static function highest(): self
    {
        return self::Level7;
    }

    /** Correct answer: up one level. Level7 becomes Mastered, Mastered stays. */
    public function promote(): self
    {
        return self::tryFrom($this->value + 1) ?? $this;
    }

    /** Wrong answer: classic Leitner sends the card back to the first level. */
    public function demote(): self
    {
        return self::first();
    }

    public function next(bool $wasCorrect): self
    {
        return $wasCorrect ? $this->promote() : $this->demote();
    }

    /** Absolute time of the next review, or NULL when mastered. */
    public function nextReviewAt(?int $from = null): ?int
    {
        $seconds = $this->intervalSeconds();

        return $seconds === null ? null : ($from ?? time()) + $seconds;
    }

    public function isMastered(): bool
    {
        return $this === self::Mastered;
    }

    public function isFirst(): bool
    {
        return $this === self::first();
    }

    /**
     * Levels that still take part in reviews.
     *
     * @return self[]
     */
    public static function reviewable(): array
    {
        return array_values(array_filter(
            self::cases(),
            static fn(self $level) => !$level->isMastered()
        ));
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        $options = [];

        foreach (self::cases() as $case) {
            $options[$case->value] = $case->label();
        }

        return $options;
    }
}
