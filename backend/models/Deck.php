<?php

namespace app\models;

use app\enums\DeckDirection;
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
 * @property int|null    $color     palette index
 * @property int         $direction see DeckDirection
 * @property int         $created_at
 * @property int         $updated_at
 *
 * @property-read User   $user
 * @property-read Card[] $cards
 */
class Deck extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%deck}}';
    }

    public function behaviors(): array
    {
        return [TimestampBehavior::class];
    }

    public function rules(): array
    {
        return [
            [['user_id', 'name'], 'required'],
            [['user_id'], 'integer'],
            [['name'], 'trim'],
            [['name'], 'string', 'min' => 1, 'max' => 255],
            [['description'], 'string'],
            [['color'], 'integer'],
            [['direction'], 'default', 'value' => DeckDirection::FrontToBack->value],
            [['direction'], 'in', 'range' => DeckDirection::values()],
        ];
    }

    public function fields(): array
    {
        return [
            'id',
            'name',
            'description',
            'color',
            'direction',
            'direction_label' => fn(self $model) => $model->getDirection()->label(),
            'created_at',
            'updated_at',
        ];
    }

    public function getDirection(): DeckDirection
    {
        return DeckDirection::tryFrom((int) $this->direction)
            ?? DeckDirection::FrontToBack;
    }

    public function setDirection(DeckDirection $direction): void
    {
        $this->direction = $direction->value;
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public function getCards(): ActiveQuery
    {
        return $this->hasMany(Card::class, ['deck_id' => 'id']);
    }

    /**
     * Loads a deck owned by the current user, or fails with 404.
     */
    public static function findDeck(int $id): self
    {
        $model = static::findOne([
            'id' => $id,
            'user_id' => Yii::$app->user->id,
        ]);

        if ($model !== null) {
            return $model;
        }

        throw new NotFoundHttpException('Deck topilmadi yoki ruxsat yo\'q.');
    }
}
