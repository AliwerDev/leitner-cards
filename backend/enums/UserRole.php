<?php

namespace app\enums;

/**
 * Account role. Set directly in the database for now - no endpoint grants it,
 * and no check reads it yet.
 */
enum UserRole: int
{
    case User = 1;
    case Admin = 10;

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    public function label(): string
    {
        return match ($this) {
            self::User => 'Foydalanuvchi',
            self::Admin => 'Administrator',
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
