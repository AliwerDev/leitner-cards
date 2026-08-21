<?php

namespace app\models;

use app\enums\UserRole;
use app\enums\UserStatus;
use app\enums\UserType;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;
use yii\web\IdentityInterface;

/**
 * @property int    $id
 * @property string $username
 * @property string $email
 * @property string $password_hash
 * @property string $auth_key
 * @property int    $status
 * @property int    $type   see UserType: quotas apply to Regular only
 * @property int    $role   see UserRole: set directly in the database
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
            [['type'], 'default', 'value' => UserType::Regular->value],
            [['type'], 'in', 'range' => UserType::values()],
            [['role'], 'default', 'value' => UserRole::User->value],
            [['role'], 'in', 'range' => UserRole::values()],
        ];
    }

    /**
     * Fields for the account's own responses: /auth/me, register, login and
     * refresh.
     *
     * Only ever serialized for the authenticated caller's own row, so role is
     * safe here - the client needs it to decide whether to render the admin
     * navigation. Nothing privileged about ANOTHER user belongs in this list;
     * see adminFields() for that.
     */
    public function fields(): array
    {
        return [
            'id',
            'username',
            'email',
            'type',
            'type_label' => fn(self $model) => $model->getType()->label(),
            'is_premium' => fn(self $model) => $model->getType() === UserType::Premium,
            'role',
            'role_label' => fn(self $model) => $model->getRole()->label(),
            'is_admin' => fn(self $model) => $model->isAdmin(),
            'created_at',
        ];
    }

    /**
     * The wider shape the admin panel needs: adds status and updated_at.
     *
     * Deliberately NOT extraFields(). That is driven by the ?expand= query
     * parameter, so any authenticated caller could ask for it on their own
     * /auth/me and read fields that are none of their business. A separate
     * method means only code behind AdminAccessFilter can produce this shape.
     */
    public function adminFields(): array
    {
        return array_merge($this->fields(), [
            'status',
            'status_label' => fn(self $model) => $model->getStatus()->label(),
            'is_active' => fn(self $model) => $model->isActive(),
            'updated_at',
        ]);
    }

    /**
     * Serializes the admin shape.
     *
     * Built by hand rather than through toArray($this->adminFields()):
     * ArrayableTrait::resolveFields() intersects the requested list against
     * fields(), so status and updated_at would be dropped without a word.
     *
     * @param array<string,mixed> $extra computed values to append, such as counts
     */
    public function toAdminArray(array $extra = []): array
    {
        $result = [];

        foreach ($this->adminFields() as $key => $definition) {
            if (is_int($key)) {
                $result[$definition] = $this->{$definition};

                continue;
            }

            $result[$key] = $definition($this, $key);
        }

        return $result + $extra;
    }

    /**
     * Administrators who can currently sign in.
     *
     * Used by the guards that refuse to remove the last one: a system with no
     * usable administrator can only be repaired from the console.
     */
    public static function activeAdminCount(): int
    {
        return (int) static::find()
            ->where([
                'role' => UserRole::Admin->value,
                'status' => UserStatus::ACTIVE->value,
            ])
            ->count();
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

    /**
     * tryFrom rather than from: this now sits on a serialization path
     * (adminFields), and an unexpected column value must not turn a list
     * request into a 500. Matches getType() and getRole().
     */
    public function getStatus(): UserStatus
    {
        return UserStatus::tryFrom((int) $this->status) ?? UserStatus::INACTIVE;
    }

    public function setStatus(UserStatus $status): void
    {
        $this->status = $status->value;
    }

    public function isActive(): bool
    {
        return $this->getStatus() === UserStatus::ACTIVE;
    }

    public function getType(): UserType
    {
        return UserType::tryFrom((int) $this->type) ?? UserType::Regular;
    }

    public function setType(UserType $type): void
    {
        $this->type = $type->value;
    }

    public function getRole(): UserRole
    {
        return UserRole::tryFrom((int) $this->role) ?? UserRole::User;
    }

    public function setRole(UserRole $role): void
    {
        $this->role = $role->value;
    }

    public function isAdmin(): bool
    {
        return $this->getRole()->isAdmin();
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

    public function getDecks(): ActiveQuery
    {
        return $this->hasMany(Deck::class, ['user_id' => 'id']);
    }

    public function getRefreshTokens(): ActiveQuery
    {
        return $this->hasMany(RefreshToken::class, ['user_id' => 'id']);
    }

    public function getCardProgresses(): ActiveQuery
    {
        return $this->hasMany(CardProgress::class, ['user_id' => 'id']);
    }

    public function getReviewHistories(): ActiveQuery
    {
        return $this->hasMany(ReviewHistory::class, ['user_id' => 'id']);
    }
}
