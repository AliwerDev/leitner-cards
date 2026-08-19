<?php

namespace app\models;

use app\enums\CardLevel;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * @property int         $id
 * @property int         $user_id
 * @property int         $card_id
 * @property int         $current_level
 * @property int         $last_reviewed_at
 * @property int         $next_review_at
 * @property int         $created_at
 * @property int         $updated_at
 */
class CardProgress extends ActiveRecord
{
  public static function tableName(): string
  {
    return "{{%card_progress}}";
  }

  public function behaviors(): array
  {
    return [TimestampBehavior::class];
  }

  public function rules(): array
  {
    return [
      [
        [
          "user_id",
          "card_id",
          "current_level",
          "last_reviewed_at",
          "next_review_at",
        ],
        "required",
      ],
      [
        [
          "user_id",
          "card_id",
          "current_level",
          "last_reviewed_at",
          "next_review_at",
        ],
        "integer",
      ],
      [["current_level"], "range" => CardLevel::values()],
    ];
  }

  public function fields(): array
  {
    return [
      "id",
      "current_level",
      "last_reviewed_at",
      "next_review_at",
      "created_at",
      "updated_at",
    ];
  }
}
