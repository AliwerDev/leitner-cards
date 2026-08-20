<?php

namespace app\models;

use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;
use yii\web\NotFoundHttpException;

/**
 * @property int         $id
 * @property int         $deck_id
 * @property string      $front
 * @property string      $back
 * @property int         $created_at
 * @property int         $updated_at
 *
 * @property-read Deck               $deck
 * @property-read CardProgress|null  $progress
 * @property-read CardProgress[]     $progresses
 * @property-read ReviewHistory[]    $reviewHistories
 */
class Card extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%card}}';
    }

    public function behaviors(): array
    {
        return [
            TimestampBehavior::class,
        ];
    }

    public function rules(): array
    {
        return [
            [['deck_id', 'front', 'back'], 'required'],
            [['deck_id'], 'integer'],
            [['front', 'back'], 'trim'],
            [['front', 'back'], 'string', 'min' => 1, 'max' => 1000],
        ];
    }


    public function fields(): array
    {
        return ['id', 'front', 'back', 'created_at', 'updated_at'];
    }

    public function getDeck(): ActiveQuery
    {
        return $this->hasOne(Deck::class, ['id' => 'deck_id']);
    }

    public function getProgresses(): ActiveQuery
    {
        return $this->hasMany(CardProgress::class, ['card_id' => 'id']);
    }

    /**
     * The current user's progress on this card, for eager loading.
     * Use ReviewService for anything that needs a guaranteed row.
     */
    public function getProgress(): ActiveQuery
    {
        return $this->hasOne(CardProgress::class, ['card_id' => 'id'])
            ->andOnCondition(['card_progress.user_id' => Yii::$app->user->id]);
    }

    public function getReviewHistories(): ActiveQuery
    {
        return $this->hasMany(ReviewHistory::class, ['card_id' => 'id'])
            ->orderBy(['reviewed_at' => SORT_DESC]);
    }

    /**
     * Loads a card that belongs to a deck owned by the given user (defaults to
     * the current one), or fails with 404. Mirrors Deck::findDeck().
     */
    public static function findOwned(int $id, ?int $userId = null): self
    {
        $card = static::find()
            ->alias('card')
            ->innerJoinWith('deck')
            ->andWhere(['card.id' => $id])
            ->andWhere(['deck.user_id' => $userId ?? Yii::$app->user->id])
            ->one();

        if ($card !== null) {
            return $card;
        }

        throw new NotFoundHttpException('Karta topilmadi yoki ruxsat yo\'q.');
    }
}
