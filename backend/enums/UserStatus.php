<?php

namespace app\enums;

enum UserStatus: int
{
  case DELETED = 0;
  case INACTIVE = 5;
  case ACTIVE = 10;

  public static function values(): array
  {
    return array_column(self::cases(), "value");
  }

  public static function options(): array
  {
    $options = [];

    foreach (self::cases() as $case) {
      $options[$case->value] = $case->label();
    }

    return $options;
  }

  public function label(): string
  {
    return match ($this) {
      self::DELETED => 'O\'chirilgan',
      self::INACTIVE => "Faolsiz",
      self::ACTIVE => "Faol",
    };
  }
}
