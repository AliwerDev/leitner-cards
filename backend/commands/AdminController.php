<?php

namespace app\commands;

use app\enums\UserRole;
use app\models\User;
use yii\console\Controller;
use yii\console\ExitCode;

/**
 * Role bootstrap.
 *
 * The API grants the admin role, but only to a caller who already has it, so
 * the first administrator has to be made from here. Replaces the raw UPDATE the
 * README used to document.
 */
class AdminController extends Controller
{
    /**
     * Grants the administrator role.
     *
     * php yii admin/promote alisher
     */
    public function actionPromote(string $login): int
    {
        $user = $this->find($login);

        if ($user === null) {
            $this->stderr("Foydalanuvchi topilmadi: {$login}\n");

            return ExitCode::DATAERR;
        }

        if ($user->isAdmin()) {
            $this->stdout("{$user->username} allaqachon administrator.\n");

            return ExitCode::OK;
        }

        $user->setRole(UserRole::Admin);

        if (!$user->save(false, ['role', 'updated_at'])) {
            $this->stderr("Saqlash muvaffaqiyatsiz tugadi.\n");

            return ExitCode::UNSPECIFIED_ERROR;
        }

        $this->stdout("{$user->username} (id {$user->id}) administrator qilindi.\n");

        return ExitCode::OK;
    }

    /**
     * Revokes the administrator role.
     *
     * Refuses to remove the last usable administrator: a system with none can
     * only be repaired with raw SQL.
     *
     * php yii admin/demote alisher
     */
    public function actionDemote(string $login): int
    {
        $user = $this->find($login);

        if ($user === null) {
            $this->stderr("Foydalanuvchi topilmadi: {$login}\n");

            return ExitCode::DATAERR;
        }

        if (!$user->isAdmin()) {
            $this->stdout("{$user->username} administrator emas.\n");

            return ExitCode::OK;
        }

        if (User::activeAdminCount() <= 1) {
            $this->stderr("Bu yagona administrator. Avval boshqasini tayinlang.\n");

            return ExitCode::DATAERR;
        }

        $user->setRole(UserRole::User);

        if (!$user->save(false, ['role', 'updated_at'])) {
            $this->stderr("Saqlash muvaffaqiyatsiz tugadi.\n");

            return ExitCode::UNSPECIFIED_ERROR;
        }

        $this->stdout("{$user->username} oddiy foydalanuvchi qilindi.\n");

        return ExitCode::OK;
    }

    /**
     * Lists administrators.
     *
     * php yii admin/list
     */
    public function actionList(): int
    {
        $admins = User::find()
            ->where(['role' => UserRole::Admin->value])
            ->orderBy(['id' => SORT_ASC])
            ->all();

        if ($admins === []) {
            $this->stdout("Administrator yo'q.\n");

            return ExitCode::OK;
        }

        foreach ($admins as $admin) {
            $this->stdout(sprintf(
                "%4d  %-20s %-30s %s\n",
                $admin->id,
                $admin->username,
                $admin->email,
                $admin->getStatus()->label()
            ));
        }

        return ExitCode::OK;
    }

    /**
     * By username or email, any status.
     *
     * Not User::findByUsernameOrEmail(), which filters on ACTIVE: the account
     * being promoted may well be inactive.
     */
    private function find(string $login): ?User
    {
        return User::find()
            ->where(['or', ['username' => $login], ['email' => $login]])
            ->one();
    }
}
