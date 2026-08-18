<?php

namespace app\modules\api;

use yii\base\Module as BaseModule;

class Module extends BaseModule
{
    public $controllerNamespace = 'app\modules\api\controllers';

    public function init(): void
    {
        parent::init();

        $this->modules = [
            'v1' => [
                'class' => v1\Module::class,
            ],
        ];
    }
}
