<?php

namespace app\models;

use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

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
        return '{{%deck}}';
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
            [['user_id', 'name'], 'required'],
            [['user_id'], 'integer'],
            [['name'], 'trim'],
            [['name'], 'string', 'min' => 1, 'max' => 255],
            [['description'], 'string'],
        ];
    }


    public function fields(): array
    {
        return ['id', 'name', 'description', 'created_at', 'updated_at'];
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }
}
