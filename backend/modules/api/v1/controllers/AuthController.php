<?php

namespace app\modules\api\v1\controllers;

use Yii;
use app\components\JwtService;
use app\models\RefreshToken;
use app\models\User;
use app\modules\api\v1\models\LoginForm;
use app\modules\api\v1\models\RegisterForm;
use yii\filters\VerbFilter;
use yii\web\BadRequestHttpException;
use yii\web\ServerErrorHttpException;
use yii\web\UnauthorizedHttpException;
use yii\web\UnprocessableEntityHttpException;

class AuthController extends BaseApiController
{
    protected function publicActions(): array
    {
        return ['register', 'login', 'refresh'];
    }

    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'register' => ['POST'],
                    'login' => ['POST'],
                    'refresh' => ['POST'],
                    'logout' => ['POST'],
                    'me' => ['GET', 'HEAD'],
                ],
            ],
        ]);
    }

    public function actionRegister(): array
    {
        $form = new RegisterForm();
        $form->load(Yii::$app->request->getBodyParams(), '');

        $user = $form->register();

        if ($user === null) {
            return $this->validationError($form->getErrors());
        }

        Yii::$app->response->statusCode = 201;

        return ['user' => $user->toArray()] + $this->jwt()->issuePair($user);
    }

    public function actionLogin(): array
    {
        $form = new LoginForm();
        $form->load(Yii::$app->request->getBodyParams(), '');

        if (!$form->validate()) {
            throw new UnauthorizedHttpException('Incorrect login or password.');
        }

        $user = $form->getUser();

        return ['user' => $user->toArray()] + $this->jwt()->issuePair($user);
    }

    public function actionRefresh(): array
    {
        $token = (string) (Yii::$app->request->getBodyParam('refresh_token') ?? '');

        if ($token === '') {
            throw new BadRequestHttpException('refresh_token is required.');
        }

        $jwt = $this->jwt();
        $record = RefreshToken::findUsable($jwt->hashRefreshToken($token));

        if ($record === null || !$record->isUsable()) {
            throw new UnauthorizedHttpException('Refresh token is invalid or expired.');
        }

        $user = User::findIdentity($record->user_id);

        if ($user === null) {
            throw new UnauthorizedHttpException('Account is no longer active.');
        }

        // Rotate: the presented refresh token is single-use
        $record->revoked_at = time();
        if (!$record->save(false, ['revoked_at'])) {
            throw new ServerErrorHttpException('Unable to rotate refresh token.');
        }

        return ['user' => $user->toArray()] + $jwt->issuePair($user);
    }

    public function actionLogout(): array
    {
        $token = Yii::$app->request->getBodyParam('refresh_token');

        if (is_string($token) && $token !== '') {
            $this->jwt()->revokeRefreshToken($token);
        } else {
            $this->jwt()->revokeAllForUser(Yii::$app->user->id);
        }

        return ['message' => 'Logged out.'];
    }

    public function actionMe(): array
    {
        /** @var User $user */
        $user = Yii::$app->user->identity;

        return ['user' => $user->toArray()];
    }

    private function jwt(): JwtService
    {
        /** @var JwtService $service */
        $service = Yii::$app->get('jwt');

        return $service;
    }
}
