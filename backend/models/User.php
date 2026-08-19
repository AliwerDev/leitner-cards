<?php

namespace app\models;

use app\enums\UserStatus;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;
use yii\web\IdentityInterface;

/**
 * @property int    $id
 * @property string $username
 * @property string $email
 * @property string $password_hash
 * @property string $auth_key
 * @property int    $status
 * @property int    $created_at
 * @property int    $updated_at
 */
class User extends ActiveRecord implements IdentityInterface
{
    public static function tableName(): string
    {
        return '{{%user}}';
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
            [['username', 'email', 'password_hash', 'auth_key'], 'required'],
            [['username'], 'string', 'min' => 3, 'max' => 64],
            [['email'], 'email'],
            [['email'], 'string', 'max' => 255],
            [['username'], 'unique'],
            [['email'], 'unique'],
            [['status'], 'default', 'value' => UserStatus::ACTIVE->value],
            [['status'], 'in', 'range' => UserStatus::values()],
        ];
    }

    public function fields(): array
    {
        return [
            'id',
            'username',
            'email',
            'created_at',
        ];
    }

    public static function findIdentity($id): ?self
    {
        return static::findOne(['id' => $id, 'status' => UserStatus::ACTIVE->value]);
    }

    /**
     * Resolves the identity from a decoded JWT payload handled by JwtHttpBearerAuth.
     */
    public static function findIdentityByAccessToken($token, $type = null): ?self
    {
        return static::findIdentity($token);
    }

    public static function findByUsernameOrEmail(string $login): ?self
    {
        return static::find()
            ->where(['status' => UserStatus::ACTIVE->value])
            ->andWhere(['or', ['username' => $login], ['email' => $login]])
            ->one();
    }

    public function getStatus(): UserStatus
    {
        return UserStatus::from($this->status);
    }

    public function setStatus(UserStatus $status): void
    {
        $this->status = $status->value;
    }

    public function isActive(): bool
    {
        return $this->getStatus() === UserStatus::ACTIVE;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getAuthKey(): string
    {
        return $this->auth_key;
    }

    public function validateAuthKey($authKey): bool
    {
        return $this->auth_key === $authKey;
    }

    public function setPassword(string $password): void
    {
        $this->password_hash = Yii::$app->security->generatePasswordHash($password);
    }

    public function validatePassword(string $password): bool
    {
        return Yii::$app->security->validatePassword($password, $this->password_hash);
    }

    public function generateAuthKey(): void
    {
        $this->auth_key = Yii::$app->security->generateRandomString(32);
    }
}
