<?php

namespace app\models;

use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * @property int      $id
 * @property int      $user_id
 * @property string   $token_hash
 * @property int      $expires_at
 * @property int|null $revoked_at
 * @property int      $created_at
 */
class RefreshToken extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%refresh_token}}';
    }

    public function behaviors(): array
    {
        return [
            [
                'class' => TimestampBehavior::class,
                'updatedAtAttribute' => false,
            ],
        ];
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public function isUsable(): bool
    {
        return $this->revoked_at === null && $this->expires_at > time();
    }

    public static function findUsable(string $tokenHash): ?self
    {
        return static::findOne(['token_hash' => $tokenHash, 'revoked_at' => null]);
    }
}
