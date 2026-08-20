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
                    'daily' => ['GET', 'HEAD'],
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

    /**
     * GET /api/v1/stats/daily?days=30&deckId=3
     *
     * Reviews per calendar day, oldest first, with every empty day present.
     * The service clamps `days`, so an absurd value costs nothing.
     */
    public function actionDaily(int $days = 30, ?int $deckId = null): array
    {
        return [
            'days' => (new ReviewService())->dailySeries((int) Yii::$app->user->id, $days, $deckId),
        ];
    }
}
