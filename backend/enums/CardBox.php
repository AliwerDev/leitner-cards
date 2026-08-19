<?php

namespace app\enums;

enum CardBox: int
{
    case Box1 = 1;
    case Box2 = 2;
    case Box3 = 3;
    case Box4 = 4;
    case Box5 = 5;
    case Box6 = 6;
    case Box7 = 7;
    case Mastered = 8;

    /**
     * Days to wait before this card is asked again.
     * Box1 returns 0 — the card is due the same day.
     * Mastered returns null — the card leaves the rotation.
     *
     * To shrink intervals for manual testing, edit this single method
     * and revert it afterwards — enum cases are compile-time constants,
     * so they cannot be overridden from .env or the database.
     */
    public function intervalDays(): ?int
    {
        return match ($this) {
            self::Box1 => 0,
            self::Box2 => 2,
            self::Box3 => 3,
            self::Box4 => 7,
            self::Box5 => 15,
            self::Box6 => 31,
            self::Box7 => 61,
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
            self::Box1 => '1-quti (o\'sha kun)',
            self::Box2 => '2-quti (2 kun)',
            self::Box3 => '3-quti (3 kun)',
            self::Box4 => '4-quti (7 kun)',
            self::Box5 => '5-quti (15 kun)',
            self::Box6 => '6-quti (31 kun)',
            self::Box7 => '7-quti (61 kun)',
            self::Mastered => 'O\'zlashtirilgan',
        };
    }

    public static function first(): self
    {
        return self::Box1;
    }

    /**
     * Highest box still in the review rotation.
     */
    public static function highest(): self
    {
        return self::Box7;
    }

    /**
     * Correct answer — one box up; Box7 graduates to Mastered.
     */
    public function promote(): self
    {
        return self::tryFrom($this->value + 1) ?? $this;
    }

    /**
     * Wrong answer — back to the first box, mastered cards included.
     */
    public function demote(): self
    {
        return self::first();
    }

    public function next(bool $wasCorrect): self
    {
        return $wasCorrect ? $this->promote() : $this->demote();
    }

    /**
     * Absolute timestamp of the next review, counted from $from (default: now).
     * Returns null for mastered cards, which are never scheduled again.
     */
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
     * Boxes that take part in reviewing, i.e. everything but Mastered.
     */
    public static function reviewable(): array
    {
        return array_filter(self::cases(), static fn (self $box) => !$box->isMastered());
    }

    /**
     * Raw values for validation rules and query conditions.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Value => label map, ready for dropdowns.
     */
    public static function options(): array
    {
        $options = [];

        foreach (self::cases() as $case) {
            $options[$case->value] = $case->label();
        }

        return $options;
    }
}
