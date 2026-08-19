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

  public function label(): string
  {
    return match ($this) {
      self::Box1 => "1-quti",
      self::Box2 => "2-quti",
      self::Box3 => "3-quti",
      self::Box4 => "4-quti",
      self::Box5 => "5-quti",
      self::Box6 => "6-quti",
      self::Box7 => "7-quti",
      self::Mastered => 'O\'zlashtirilgan',
    };
  }
}
