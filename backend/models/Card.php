<?php

namespace app\models;

use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * @property int         $id
 * @property int         $deck_id
 * @property string      $front
 * @property string      $back
 * @property int         $created_at
 * @property int         $updated_at
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
        return ['id', 'front', 'back', 'deck', 'created_at', 'updated_at'];
    }

    public function getDeck(): ActiveQuery
    {
        return $this->hasOne(Deck::class, ['id' => 'deck_id']);
    }
}
