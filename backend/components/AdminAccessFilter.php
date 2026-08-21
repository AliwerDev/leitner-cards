<?php

namespace app\components;

use app\models\User;
use Yii;
use yii\base\ActionFilter;
use yii\web\ForbiddenHttpException;

/**
 * Rejects any request whose identity is not an administrator.
 *
 * Ordering matters. This filter must attach AFTER the authenticator, so that a
 * request with no token fails there with 401 instead of arriving here as a
 * guest and being reported as 403. Behaviors attach in the order behaviors()
 * returns them, and AdminApiController appends this one after the parent's
 * 'authenticator' key, so the order holds.
 *
 * The role is read from the identity row, which JwtHttpBearerAuth reloads from
 * the database on every request - the JWT carries no role claim. A role revoked
 * in the database therefore takes effect on the next call, with no token
 * rotation needed.
 */
class AdminAccessFilter extends ActionFilter
{
    public function beforeAction($action): bool
    {
        $identity = Yii::$app->user->identity;

        // Defence in depth: the authenticator already rejected guests. If this
        // branch ever runs, the filter was attached ahead of the authenticator.
        if (!$identity instanceof User || !$identity->isAdmin()) {
            throw new ForbiddenHttpException('Admin access required.');
        }

        return true;
    }
}
