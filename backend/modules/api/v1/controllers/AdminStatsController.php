<?php

namespace app\modules\api\v1\controllers;

use app\services\AdminStatsService;
use yii\filters\VerbFilter;

/**
 * Read-only account-wide aggregates for the admin dashboard.
 */
class AdminStatsController extends AdminApiController
{
    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'index' => ['GET', 'HEAD'],
                ],
            ],
        ]);
    }

    // GET /api/v1/admin/stats
    public function actionIndex(): array
    {
        return (new AdminStatsService())->dashboard();
    }
}
