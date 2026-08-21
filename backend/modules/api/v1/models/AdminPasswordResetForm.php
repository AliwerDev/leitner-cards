<?php

namespace app\modules\api\v1\models;

use app\components\JwtService;
use app\models\User;
use Yii;
use yii\base\Model;
use yii\web\ServerErrorHttpException;

/**
 * Sets a new password for another account on behalf of an administrator.
 *
 * The old password is not required - that is the point of an admin reset - so
 * the length floor and the confirmation field are the only protection against a
 * mistyped value locking someone out.
 */
class AdminPasswordResetForm extends Model
{
    public ?string $password = null;
    public ?string $password_repeat = null;

    private User $user;

    public function __construct(User $user, array $config = [])
    {
        $this->user = $user;

        parent::__construct($config);
    }

    public function rules(): array
    {
        return [
            [['password', 'password_repeat'], 'required'],
            // No trim: leading and trailing spaces are legitimate password
            // characters, and stripping them would set a password the admin did
            // not type. The 72 ceiling is bcrypt's own.
            [['password'], 'string', 'min' => 8, 'max' => 72],
            [['password_repeat'], 'compare', 'compareAttribute' => 'password',
                'message' => 'Parollar mos kelmadi.'],
        ];
    }

    /**
     * Rotates the password, the auth key and every refresh token in one
     * transaction.
     *
     * Revoking is not optional: a reset answers a compromise or a lockout, and
     * a session that survives it defeats both.
     *
     * The column list restricts the UPDATE, so a stale in-memory User cannot
     * write back an old type, role or status. updated_at must be listed or
     * TimestampBehavior computes the value and it is then not persisted.
     *
     * Note: an access token already issued stays valid until it expires - the
     * JWT carries only uid and findIdentity() checks status, not a password
     * version. The blast radius is bounded by accessTtl, one hour.
     * TODO: a token version column would close that window.
     *
     * @return int number of refresh tokens revoked
     */
    public function apply(): int
    {
        $this->user->setPassword((string) $this->password);
        $this->user->generateAuthKey();

        $transaction = Yii::$app->db->beginTransaction();

        try {
            if (!$this->user->save(false, ['password_hash', 'auth_key', 'updated_at'])) {
                throw new ServerErrorHttpException('Parolni saqlash muvaffaqiyatsiz tugadi.');
            }

            /** @var JwtService $jwt */
            $jwt = Yii::$app->get('jwt');
            $revoked = $jwt->revokeAllForUser($this->user->id);

            $transaction->commit();
        } catch (\Throwable $e) {
            $transaction->rollBack();

            throw $e;
        }

        return $revoked;
    }
}
