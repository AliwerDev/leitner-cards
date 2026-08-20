<?php

namespace app\modules\api\v1\controllers;

use app\components\JwtHttpBearerAuth;
use Yii;
use yii\filters\ContentNegotiator;
use yii\filters\Cors;
use yii\rest\Controller;
use yii\web\Response;

abstract class BaseApiController extends Controller
{
    /**
     * Actions reachable without a Bearer token.
     */
    protected function publicActions(): array
    {
        return [];
    }

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        unset($behaviors['authenticator'], $behaviors['rateLimiter']);

        $behaviors['contentNegotiator'] = [
            'class' => ContentNegotiator::class,
            'formats' => [
                'application/json' => Response::FORMAT_JSON,
            ],
        ];

        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['*'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['Authorization', 'Content-Type', 'Accept'],
                'Access-Control-Allow-Credentials' => null,
                'Access-Control-Max-Age' => 3600,
            ],
        ];

        $behaviors['authenticator'] = [
            'class' => JwtHttpBearerAuth::class,
            'except' => array_merge(['options'], $this->publicActions()),
        ];

        return $behaviors;
    }

    /**
     * 422 response carrying per-field errors.
     *
     * Returns the full envelope on purpose: the response hook in config/web.php
     * passes through any payload that already has a `success` key, which keeps
     * the `fields` detail intact.
     */
    protected function validationError(array $errors): array
    {
        Yii::$app->response->statusCode = 422;

        return [
            'success' => false,
            'data' => null,
            'error' => [
                'code' => 422,
                'name' => 'Unprocessable Entity',
                'message' => 'Validation failed.',
                'fields' => $errors,
            ],
        ];
    }
}
