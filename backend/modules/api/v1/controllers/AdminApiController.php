<?php

namespace app\modules\api\v1\controllers;

use app\components\AdminAccessFilter;

/**
 * Base class for every admin-only endpoint.
 *
 * Inherits the authenticator, CORS and content negotiation from
 * BaseApiController and adds the role check on top. The 'adminAccess' key is
 * appended after the parent's keys on purpose: behaviors run in declaration
 * order, so the authenticator answers a missing token with 401 before the role
 * check can answer it with 403.
 *
 * A subclass that overrides behaviors() MUST array_merge onto
 * parent::behaviors(), as every controller here already does. Returning a bare
 * array drops both the authenticator and this guard, and the endpoint becomes
 * public.
 */
abstract class AdminApiController extends BaseApiController
{
    /**
     * No admin action may ever be public: the role check needs an identity, so
     * an entry here would expose an admin endpoint to anonymous callers.
     */
    final protected function publicActions(): array
    {
        return [];
    }

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        $behaviors['adminAccess'] = [
            'class' => AdminAccessFilter::class,
            // OPTIONS carries no Authorization header (CORS preflight), and the
            // authenticator already excepts it.
            'except' => ['options'],
        ];

        return $behaviors;
    }
}
