<?php

namespace app\modules\api\v1\controllers;

use app\enums\UserRole;
use app\enums\UserStatus;
use app\enums\UserType;
use app\models\User;
use app\modules\api\v1\models\AdminPasswordResetForm;
use app\modules\api\v1\models\AdminUserUpdateForm;
use app\services\AdminStatsService;
use app\services\QuotaService;
use app\services\ReviewService;
use Yii;
use yii\data\ActiveDataProvider;
use yii\filters\VerbFilter;
use yii\web\NotFoundHttpException;

class AdminUserController extends AdminApiController
{
    /** Longest accepted `q` value, matching CardController. */
    private const MAX_SEARCH_LENGTH = 255;

    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'index' => ['GET', 'HEAD'],
                    'view' => ['GET', 'HEAD'],
                    'stats' => ['GET', 'HEAD'],
                    'update' => ['PUT', 'PATCH'],
                    'delete' => ['DELETE'],
                    'reset-password' => ['POST'],
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/users?q=ali&type=10&role=1&status=10
     *
     * The filters are nullable in the signature so a bad value returns the
     * usual 422 envelope rather than Yii's bare 400.
     */
    public function actionIndex(
        ?string $q = null,
        ?int $type = null,
        ?int $role = null,
        ?int $status = null
    ): array {
        $q = trim((string) $q);

        if (mb_strlen($q) > self::MAX_SEARCH_LENGTH) {
            return $this->validationError([
                'q' => [sprintf('Qidiruv matni %d belgidan oshmasligi kerak.', self::MAX_SEARCH_LENGTH)],
            ]);
        }

        $errors = [];

        if ($type !== null && !in_array($type, UserType::values(), true)) {
            $errors['type'] = ['Hisob turi noto\'g\'ri.'];
        }

        if ($role !== null && !in_array($role, UserRole::values(), true)) {
            $errors['role'] = ['Rol noto\'g\'ri.'];
        }

        if ($status !== null && !in_array($status, UserStatus::values(), true)) {
            $errors['status'] = ['Holat noto\'g\'ri.'];
        }

        if ($errors !== []) {
            return $this->validationError($errors);
        }

        $query = User::find();

        if ($type !== null) {
            $query->andWhere(['type' => $type]);
        }

        if ($role !== null) {
            $query->andWhere(['role' => $role]);
        }

        if ($status !== null) {
            $query->andWhere(['status' => $status]);
        }

        if ($q !== '') {
            // Escape the LIKE wildcards so a literal % or _ matches itself.
            // Passing false stops Yii re-wrapping the value, so the %...% is
            // added here - same idiom as CardController::actionIndex().
            $needle = '%' . addcslashes($q, '%_\\') . '%';

            $query->andWhere([
                'or',
                ['ilike', 'username', $needle, false],
                ['ilike', 'email', $needle, false],
            ]);
        }

        $provider = new ActiveDataProvider([
            'query' => $query,
            /*
             * defaultPageSize, not pageSize. An explicit pageSize wins over the
             * request, so setting it would make ?per-page= silently do nothing;
             * defaultPageSize applies only when the client asks for nothing.
             * The limit keeps a caller from requesting the whole table at once.
             */
            'pagination' => ['defaultPageSize' => 20, 'pageSizeLimit' => [1, 100]],
            // Whitelisted: an open sort would let a caller order by
            // password_hash and read information out of the ordering.
            'sort' => [
                'attributes' => ['id', 'username', 'email', 'created_at', 'updated_at', 'type', 'role', 'status'],
                'defaultOrder' => ['created_at' => SORT_DESC],
            ],
        ]);

        /*
         * The rows are serialized here rather than returned as a provider.
         *
         * The REST serializer calls toArray() on each model, which resolves
         * fields() - so status, status_label and updated_at would be missing
         * from the list while the detail endpoint returns them. Mapping the
         * models through toAdminArray() keeps the two shapes identical.
         *
         * The pagination headers are written by hand for the same reason: they
         * come from the serializer, which is no longer in the path. The client
         * reads X-Pagination-* to build its pager.
         */
        $pagination = $provider->getPagination();

        // getPageCount() divides by totalCount, which the pagination object
        // does not know until it is told - getModels() above fills the
        // provider's count, not the paginator's. Without this the header reads
        // 0 and the client renders no pager at all.
        $pagination->totalCount = $provider->getTotalCount();

        $response = Yii::$app->response;
        $response->getHeaders()
            ->set('X-Pagination-Total-Count', (string) $provider->getTotalCount())
            ->set('X-Pagination-Page-Count', (string) $pagination->getPageCount())
            ->set('X-Pagination-Current-Page', (string) ($pagination->getPage() + 1))
            ->set('X-Pagination-Per-Page', (string) $pagination->getPageSize());

        return array_map(
            static fn(User $user): array => $user->toAdminArray(),
            $provider->getModels()
        );
    }

    // GET /api/v1/admin/users/7
    public function actionView(int $id): array
    {
        $user = $this->findUser($id);

        return [
            'user' => $user->toAdminArray(),
            'quota' => (new QuotaService())->summary($user->id),
            'counts' => (new AdminStatsService())->userCounts($user->id),
        ];
    }

    /**
     * PUT, PATCH /api/v1/admin/users/7   body: {type?, role?, status?}
     *
     * Only the keys present are applied. The form owns the self-lockout and
     * last-admin guards.
     */
    public function actionUpdate(int $id): array
    {
        $user = $this->findUser($id);
        $form = new AdminUserUpdateForm($user, (int) Yii::$app->user->id);
        $form->load(Yii::$app->request->getBodyParams(), '');

        if (!$form->validate()) {
            return $this->validationError($form->getErrors());
        }

        $revoked = $form->apply();

        return [
            'user' => $user->toAdminArray(),
            'revoked_sessions' => $revoked,
            'message' => 'Foydalanuvchi ma\'lumotlari yangilandi.',
        ];
    }

    /**
     * POST /api/v1/admin/users/7/reset-password
     * body: {password, password_repeat}
     */
    public function actionResetPassword(int $id): array
    {
        $user = $this->findUser($id);
        $form = new AdminPasswordResetForm($user);
        $form->load(Yii::$app->request->getBodyParams(), '');

        if (!$form->validate()) {
            return $this->validationError($form->getErrors());
        }

        $revoked = $form->apply();

        return [
            'revoked_sessions' => $revoked,
            'message' => 'Parol yangilandi va barcha seanslar tugatildi.',
        ];
    }

    /**
     * DELETE /api/v1/admin/users/7
     *
     * Soft delete: the status goes to DELETED and the refresh tokens are
     * revoked. A real DELETE would cascade through decks, cards, progress and
     * the whole review history - every foreign key into user is ON DELETE
     * CASCADE - so it would destroy the account's data AND retroactively move
     * the dashboard totals. findIdentity() filters on ACTIVE, so the status flip
     * already ends access on the next request.
     *
     * Reusing the update form means the self-delete and last-admin guards apply
     * here too. Their errors land on the `status` field, which is why a DELETE
     * with no body can still answer 422 with error.fields.status.
     */
    public function actionDelete(int $id): array
    {
        $user = $this->findUser($id);
        $form = new AdminUserUpdateForm($user, (int) Yii::$app->user->id);
        $form->status = UserStatus::DELETED->value;

        if (!$form->validate()) {
            return $this->validationError($form->getErrors());
        }

        $revoked = $form->apply();

        return [
            'user' => $user->toAdminArray(),
            'revoked_sessions' => $revoked,
            'message' => 'Foydalanuvchi o\'chirildi.',
        ];
    }

    /**
     * GET /api/v1/admin/users/7/stats?days=30
     *
     * ReviewService takes an explicit $userId everywhere, so it needs no change
     * to serve another account. No deckId parameter: the panel wants
     * account-wide numbers, and assertDeckOwned() would answer a foreign deck
     * with a 404 worded for the deck's owner.
     */
    public function actionStats(int $id, int $days = 30): array
    {
        $user = $this->findUser($id);
        $reviews = new ReviewService();

        return [
            'user' => $user->toAdminArray(),
            // The service clamps `days`, so an absurd value costs nothing.
            'stats' => $reviews->stats($user->id),
            'days' => $reviews->dailySeries($user->id, $days),
        ];
    }

    /**
     * Any user by id, whatever the status.
     *
     * NOT User::findIdentity(), which filters on ACTIVE - an admin has to be
     * able to open a blocked or soft-deleted account in order to restore it.
     */
    private function findUser(int $id): User
    {
        $user = User::findOne(['id' => $id]);

        if ($user === null) {
            throw new NotFoundHttpException('Foydalanuvchi topilmadi.');
        }

        return $user;
    }
}
