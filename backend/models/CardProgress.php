<?php

namespace app\models;

use app\enums\CardLevel;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * @property int      $id
 * @property int      $user_id
 * @property int      $card_id
 * @property int      $current_level
 * @property int|null $last_reviewed_at NULL until the first review
 * @property int|null $next_review_at   NULL once mastered
 * @property int      $created_at
 * @property int      $updated_at
 *
 * @property-read Card $card
 * @property-read User $user
 */
class CardProgress extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%card_progress}}';
    }

    public function behaviors(): array
    {
        return [TimestampBehavior::class];
    }

    public function rules(): array
    {
        return [
            [['user_id', 'card_id', 'current_level'], 'required'],
            [['user_id', 'card_id', 'current_level'], 'integer'],
            [['last_reviewed_at', 'next_review_at'], 'integer'],
            [['last_reviewed_at', 'next_review_at'], 'default', 'value' => null],
            [['current_level'], 'default', 'value' => CardLevel::first()->value],
            [['current_level'], 'in', 'range' => CardLevel::values()],
            [['user_id', 'card_id'], 'unique', 'targetAttribute' => ['user_id', 'card_id']],
        ];
    }

    public function fields(): array
    {
        return [
            'id',
            'current_level',
            'level_label' => fn(self $model) => $model->getLevel()->label(),
            'is_mastered' => fn(self $model) => $model->getLevel()->isMastered(),
            'last_reviewed_at',
            'next_review_at',
            'created_at',
            'updated_at',
        ];
    }

    public function getLevel(): CardLevel
    {
        return CardLevel::from($this->current_level);
    }

    public function setLevel(CardLevel $level): void
    {
        $this->current_level = $level->value;
    }

    public function getCard(): ActiveQuery
    {
        return $this->hasOne(Card::class, ['id' => 'card_id']);
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    /**
     * Progress rows whose next review time has arrived. Mastered cards have a
     * NULL next_review_at and are therefore excluded by construction.
     */
    public static function due(int $userId, ?int $at = null): ActiveQuery
    {
        return static::find()
            ->andWhere(['user_id' => $userId])
            ->andWhere(['not', ['next_review_at' => null]])
            ->andWhere(['<=', 'next_review_at', $at ?? time()]);
    }
}
