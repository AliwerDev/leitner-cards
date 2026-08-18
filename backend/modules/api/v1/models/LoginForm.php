<?php

namespace app\modules\api\v1\models;

use app\models\User;
use yii\base\Model;

class LoginForm extends Model
{
    public ?string $login = null;
    public ?string $password = null;

    private ?User $user = null;

    public function rules(): array
    {
        return [
            [['login', 'password'], 'required'],
            [['login', 'password'], 'trim'],
            [['password'], 'validatePassword'],
        ];
    }

    public function validatePassword(string $attribute): void
    {
        if ($this->hasErrors()) {
            return;
        }

        $user = $this->getUser();

        if ($user === null || !$user->validatePassword($this->$attribute)) {
            $this->addError($attribute, 'Incorrect login or password.');
        }
    }

    public function getUser(): ?User
    {
        if ($this->user === null && $this->login !== null) {
            $this->user = User::findByUsernameOrEmail($this->login);
        }

        return $this->user;
    }
}
