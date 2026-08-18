<?php

namespace app\components;

use Yii;
use yii\filters\auth\HttpBearerAuth;
use yii\web\IdentityInterface;
use yii\web\Request;
use yii\web\Response;
use yii\web\User as WebUser;

class JwtHttpBearerAuth extends HttpBearerAuth
{
    /**
     * @param WebUser  $user
     * @param Request  $request
     * @param Response $response
     */
    public function authenticate($user, $request, $response): ?IdentityInterface
    {
        $authHeader = $request->getHeaders()->get('Authorization');

        if ($authHeader === null || !preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return null;
        }

        /** @var JwtService $jwt */
        $jwt = Yii::$app->get('jwt');
        $payload = $jwt->parse(trim($matches[1]));

        if ($payload === null) {
            $this->handleFailure($response);
        }

        $identity = $user->loginByAccessToken((int) $payload->uid, static::class);

        if ($identity === null) {
            $this->handleFailure($response);
        }

        return $identity;
    }
}
