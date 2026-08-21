<?php

namespace app\modules\api\v1\models;

use app\components\JwtService;
use app\enums\UserRole;
use app\enums\UserStatus;
use app\enums\UserType;
use app\models\User;
use Yii;
use yii\base\Model;
use yii\web\ServerErrorHttpException;

/**
 * Changes a user's tier, role or status on behalf of an administrator.
 *
 * Partial by design: only the keys present in the request body are applied, so
 * a panel that edits one dropdown does not resend the others and risk
 * clobbering a concurrent change.
 *
 * The self-lockout and last-admin guards live here rather than in the
 * controller, so a future console command gets them for free.
 */
class AdminUserUpdateForm extends Model
{
    public ?int $type = null;
    public ?int $role = null;
    public ?int $status = null;

    private User $user;
    private int $actorId;

    public function __construct(User $user, int $actorId, array $config = [])
    {
        $this->user = $user;
        $this->actorId = $actorId;

        parent::__construct($config);
    }

    /**
     * Every inline validator carries skipOnEmpty => false.
     *
     * Inline validators are skipped when the attribute is empty, and on a
     * partial request the attributes ARE null - so without this the guards
     * below would never run and the form would silently accept anything.
     *
     * The `in` rules keep the default skipOnEmpty on purpose: skipping an
     * absent field is exactly what makes the update partial.
     */
    public function rules(): array
    {
        return [
            [['type', 'role', 'status'], 'integer'],
            [['type'], 'in', 'range' => UserType::values(),
                'message' => 'Hisob turi noto\'g\'ri.'],
            [['role'], 'in', 'range' => UserRole::values(),
                'message' => 'Rol noto\'g\'ri.'],
            [['status'], 'in', 'range' => UserStatus::values(),
                'message' => 'Holat noto\'g\'ri.'],
            [['type'], 'validateSomethingChanged', 'skipOnEmpty' => false],
            [['role'], 'validateNotSelfDemotion', 'skipOnEmpty' => false],
            [['status'], 'validateNotSelfBlock', 'skipOnEmpty' => false],
            [['role'], 'validateNotLastAdmin', 'skipOnEmpty' => false],
            [['status'], 'validateNotLastAdmin', 'skipOnEmpty' => false],
        ];
    }

    /**
     * A request naming none of the three fields is a client bug, not a no-op
     * success: reporting it keeps a mistyped key from looking like it worked.
     */
    public function validateSomethingChanged(string $attribute): void
    {
        if ($this->type === null && $this->role === null && $this->status === null) {
            $this->addError(
                $attribute,
                'O\'zgartirish uchun kamida bitta maydon kerak: type, role yoki status.'
            );
        }
    }

    /**
     * An admin who demotes themselves loses the panel mid-session and can only
     * be restored from the console.
     */
    public function validateNotSelfDemotion(string $attribute): void
    {
        if ($this->role === null || $this->user->id !== $this->actorId) {
            return;
        }

        if ($this->role !== UserRole::Admin->value) {
            $this->addError(
                $attribute,
                'O\'zingizning administrator rolingizni olib tashlay olmaysiz.'
            );
        }
    }

    /**
     * Blocking your own account ends your own session: findIdentity() filters
     * on ACTIVE, so the very next request is a 401.
     */
    public function validateNotSelfBlock(string $attribute): void
    {
        if ($this->status === null || $this->user->id !== $this->actorId) {
            return;
        }

        if ($this->status !== UserStatus::ACTIVE->value) {
            $this->addError(
                $attribute,
                'O\'zingizning hisobingizni bloklay yoki o\'chira olmaysiz.'
            );
        }
    }

    /**
     * The system must always keep one usable administrator.
     *
     * Both a role change and a status change can remove the last one, so the
     * check reads the post-change state rather than the field that triggered it.
     *
     * Not race-proof: two concurrent requests each demoting one of the last two
     * admins both see a count of two and both succeed. Closing that needs row
     * locking or SERIALIZABLE. Accepted - it takes two simultaneous admin
     * actions, and `php yii admin/promote` is the recovery path.
     */
    public function validateNotLastAdmin(string $attribute): void
    {
        if ($this->hasErrors()) {
            return;
        }

        $wasUsableAdmin = $this->user->isAdmin() && $this->user->isActive();

        if (!$wasUsableAdmin) {
            return;
        }

        $willBeAdmin = ($this->role ?? (int) $this->user->role) === UserRole::Admin->value;
        $willBeActive = ($this->status ?? (int) $this->user->status) === UserStatus::ACTIVE->value;

        if ($willBeAdmin && $willBeActive) {
            return;
        }

        if (User::activeAdminCount() <= 1) {
            $this->addError(
                $attribute,
                'Bu tizimdagi yagona administrator. Avval boshqa administrator tayinlang.'
            );
        }
    }

    /**
     * Applies the change and, when the account loses access, revokes its
     * refresh tokens in the same transaction.
     *
     * Revoking matters: /auth/refresh re-checks findIdentity() and already
     * rejects a blocked account, but a stored token would come back to life if
     * the account were reactivated later.
     *
     * @return int number of refresh tokens revoked
     */
    public function apply(): int
    {
        $before = [
            'type' => (int) $this->user->type,
            'role' => (int) $this->user->role,
            'status' => (int) $this->user->status,
        ];

        $losesAccess = $this->status !== null && $this->status !== UserStatus::ACTIVE->value;

        if ($this->type !== null) {
            $this->user->type = $this->type;
        }

        if ($this->role !== null) {
            $this->user->role = $this->role;
        }

        if ($this->status !== null) {
            $this->user->status = $this->status;
        }

        $transaction = Yii::$app->db->beginTransaction();

        try {
            if (!$this->user->save()) {
                throw new ServerErrorHttpException('Foydalanuvchini saqlash muvaffaqiyatsiz tugadi.');
            }

            $revoked = 0;

            if ($losesAccess) {
                /** @var JwtService $jwt */
                $jwt = Yii::$app->get('jwt');
                $revoked = $jwt->revokeAllForUser($this->user->id);
            }

            $transaction->commit();
        } catch (\Throwable $e) {
            $transaction->rollBack();

            throw $e;
        }

        // The only forensic record of a privilege change. Goes to the 'admin'
        // log target in config/web.php - the default target keeps warnings and
        // errors only, so an info message without that target is discarded.
        Yii::info(sprintf(
            'admin %d changed user %d: type %d->%d, role %d->%d, status %d->%d',
            $this->actorId,
            $this->user->id,
            $before['type'],
            (int) $this->user->type,
            $before['role'],
            (int) $this->user->role,
            $before['status'],
            (int) $this->user->status
        ), 'admin');

        return $revoked;
    }

    public function getUser(): User
    {
        return $this->user;
    }
}
