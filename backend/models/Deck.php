<?php

namespace app\models;

use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;
use yii\web\NotFoundHttpException;

/**
 * @property int         $id
 * @property int         $user_id
 * @property string      $name
 * @property string|null $description
 * @property int         $created_at
 * @property int         $updated_at
 */
class Deck extends ActiveRecord
{
  public static function tableName(): string
  {
    return "{{%deck}}";
  }

  public function behaviors(): array
  {
    return [TimestampBehavior::class];
  }

  public function rules(): array
  {
    return [
      [["user_id", "name"], "required"],
      [["user_id"], "integer"],
      [["name"], "trim"],
      [["name"], "string", "min" => 1, "max" => 255],
      [["description"], "string"],
    ];
  }

  public function fields(): array
  {
    return ["id", "name", "description", "created_at", "updated_at"];
  }

  public function getUser(): ActiveQuery
  {
    return $this->hasOne(User::class, ["id" => "user_id"]);
  }

  public function getCards(): ActiveQuery
  {
    return $this->hasMany(Card::class, ["deck_id" => "id"]);
  }

  public static function findDeck(int $id): self
  {
    $model = static::findOne([
      "id" => $id,
      "user_id" => Yii::$app->user->id,
    ]);

    if ($model !== null) {
      return $model;
    }

    throw new NotFoundHttpException("Deck not found or access denied.");
  }
}
