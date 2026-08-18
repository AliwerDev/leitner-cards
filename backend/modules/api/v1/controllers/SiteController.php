<?php

namespace app\modules\api\v1\controllers;

use Yii;
use yii\filters\VerbFilter;
use yii\web\ErrorAction;

class SiteController extends BaseApiController
{
    protected function publicActions(): array
    {
        return ['health', 'error'];
    }

    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'health' => ['GET', 'HEAD'],
                ],
            ],
        ]);
    }

    public function actions(): array
    {
        return [
            'error' => [
                'class' => ErrorAction::class,
            ],
        ];
    }

    public function actionHealth(): array
    {
        $dbUp = true;

        try {
            Yii::$app->db->createCommand('SELECT 1')->queryScalar();
        } catch (\Throwable) {
            $dbUp = false;
        }

        return [
            'status' => $dbUp ? 'ok' : 'degraded',
            'db' => $dbUp,
            'time' => date(DATE_ATOM),
        ];
    }
}
