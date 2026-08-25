<?php

namespace app\models;

use app\enums\CardLevel;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Append-only review log. No created_at/updated_at: reviewed_at is the only
 * timestamp a history row needs, and rows are never updated.
 *
 * @property int         $id
 * @property int         $user_id
 * @property int         $card_id
 * @property int         $level_before
 * @property int         $level_after
 * @property bool        $was_correct
 * @property int         $reviewed_at
 * @property string|null $client_id
 *
 * @property-read Card $card
 * @property-read User $user
 */
class ReviewHistory extends ActiveRecord
{
  public static function tableName(): string
  {
    return "{{%review_history}}";
  }

  public function rules(): array
  {
    return [
      [
        ["user_id", "card_id", "level_before", "level_after", "reviewed_at"],
        "required",
      ],
      [
        ["user_id", "card_id", "level_before", "level_after", "reviewed_at"],
        "integer",
      ],
      [["was_correct"], "required"],
      [["was_correct"], "boolean"],
      [["level_before", "level_after"], "in", "range" => CardLevel::values()],
      // Optional: only an offline client sends one. The web never does, and
      // the unique index treats every NULL as distinct.
      [["client_id"], "string", "max" => 64],
    ];
  }

  /**
   * client_id is deliberately absent: it is an internal dedupe token, and the
   * only caller that sends one already knows the value it sent.
   */
  public function fields(): array
  {
    return [
      "id",
      "card_id",
      "level_before",
      "level_after",
      "was_correct",
      "reviewed_at",
    ];
  }

  public function getCard(): ActiveQuery
  {
    return $this->hasOne(Card::class, ["id" => "card_id"]);
  }

  public function getUser(): ActiveQuery
  {
    return $this->hasOne(User::class, ["id" => "user_id"]);
  }
}
