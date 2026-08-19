<?php

namespace app\models;

use app\enums\CardLevel;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;

/**
 * @property int         $id
 * @property int         $user_id
 * @property int         $card_id
 * @property int         $level_before
 * @property int         $level_after
 * @property boolean     $was_correct
 * @property int         $reviewed_at
 * @property int         $created_at
 * @property int         $updated_at
 */
class ReviewHistory extends ActiveRecord
{
  public static function tableName(): string
  {
    return "{{%review_history}}";
  }

  public function behaviors(): array
  {
    return [TimestampBehavior::class];
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
      [["was_correct"], "boolean"],
      [["level_before", "level_after"], "range" => CardLevel::values()],
    ];
  }

  public function fields(): array
  {
    return ["id", "level_before", "level_after", "was_correct", "reviewed_at"];
  }
}
