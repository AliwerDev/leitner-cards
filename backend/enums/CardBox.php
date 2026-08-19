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

  public function intervalSeconds(): ?int
  {
    $days = $this->intervalDays();

    return $days === null ? null : $days * 86400;
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

  public static function first(): self
  {
    return self::Box1;
  }

  public static function highest(): self
  {
    return self::Box7;
  }

  public function promote(): self
  {
    return self::tryFrom($this->value + 1) ?? $this;
  }

  public function demote(): self
  {
    return self::first();
  }

  public function next(bool $wasCorrect): self
  {
    return $wasCorrect ? $this->promote() : $this->demote();
  }

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

  public static function reviewable(): array
  {
    return array_filter(
      self::cases(),
      static fn(self $box) => !$box->isMastered()
    );
  }

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
}
