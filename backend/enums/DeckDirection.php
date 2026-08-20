<?php

namespace app\enums;

/**
 * Which side of a card is shown as the prompt during a review.
 * A deck-level setting: progress is tracked per card, not per direction.
 */
enum DeckDirection: int
{
    case FrontToBack = 1;
    case BackToFront = 2;

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::FrontToBack => 'Old -> Orqa',
            self::BackToFront => 'Orqa -> Old',
        };
    }

    public static function options(): array
    {
        $options = [];

        foreach (self::cases() as $case) {
            $options[$case->value] = $case->label();
        }

        return $options;
    }

    /** The card field to show as the question. */
    public function promptField(): string
    {
        return $this === self::FrontToBack ? 'front' : 'back';
    }

    /** The card field that holds the expected answer. */
    public function answerField(): string
    {
        return $this === self::FrontToBack ? 'back' : 'front';
    }
}
