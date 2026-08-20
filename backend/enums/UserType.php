<?php

namespace app\enums;

/**
 * Account tier. Quotas apply to Regular accounts only; Premium is unlimited.
 */
enum UserType: int
{
    case Regular = 1;
    case Premium = 10;

    /** How many decks the tier may own. NULL means unlimited. */
    public function maxDecks(): ?int
    {
        return match ($this) {
            self::Regular => 3,
            self::Premium => null,
        };
    }

    /** How many cards one deck may hold. NULL means unlimited. */
    public function maxCardsPerDeck(): ?int
    {
        return match ($this) {
            self::Regular => 300,
            self::Premium => null,
        };
    }

    public function isUnlimited(): bool
    {
        return $this->maxDecks() === null;
    }

    public function label(): string
    {
        return match ($this) {
            self::Regular => 'Oddiy',
            self::Premium => 'Premium',
        };
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
