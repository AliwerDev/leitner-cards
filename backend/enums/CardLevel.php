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

  public static function values(): array
  {
    return array_column(self::cases(), "value");
  }

  public function label(): string
  {
    return match ($this) {
      self::Level1 => "1-level",
      self::Level2 => "2-level",
      self::Level3 => "3-level",
      self::Level4 => "4-level",
      self::Level5 => "5-level",
      self::Level6 => "6-level",
      self::Level7 => "7-level",
      self::Mastered => 'O\'zlashtirilgan',
    };
  }
}
