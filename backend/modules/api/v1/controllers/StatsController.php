<?php

namespace app\modules\api\v1\controllers;

use app\services\ReviewService;
use Yii;
use yii\filters\VerbFilter;

/**
 * Read-only study aggregates.
 */
class StatsController extends BaseApiController
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

    /**
     * GET /api/v1/stats?deckId=3
     */
    public function actionIndex(?int $deckId = null): array
    {
        return (new ReviewService())->stats((int) Yii::$app->user->id, $deckId);
    }
}
