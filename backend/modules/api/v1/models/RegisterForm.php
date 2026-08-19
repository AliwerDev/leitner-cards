<?php

namespace app\modules\api\v1\models;

use app\enums\UserStatus;
use app\models\User;
use yii\base\Model;

class RegisterForm extends Model
{
    public ?string $username = null;
    public ?string $email = null;
    public ?string $password = null;

    public function rules(): array
    {
        return [
            [['username', 'email', 'password'], 'required'],
            [['username', 'email', 'password'], 'trim'],
            [['username'], 'string', 'min' => 3, 'max' => 64],
            [['username'], 'match', 'pattern' => '/^[\w.-]+$/', 'message' => 'Username may contain letters, digits, dot, dash and underscore only.'],
            [['username'], 'unique', 'targetClass' => User::class, 'message' => 'This username is already taken.'],
            [['email'], 'email'],
            [['email'], 'string', 'max' => 255],
            [['email'], 'unique', 'targetClass' => User::class, 'message' => 'This email is already registered.'],
            [['password'], 'string', 'min' => 8, 'max' => 72],
        ];
    }

    public function register(): ?User
    {
        if (!$this->validate()) {
            return null;
        }

        $user = new User([
            'username' => $this->username,
            'email' => $this->email,
            'status' => UserStatus::ACTIVE->value,
        ]);
        $user->setPassword($this->password);
        $user->generateAuthKey();

        return $user->save() ? $user : null;
    }
}
