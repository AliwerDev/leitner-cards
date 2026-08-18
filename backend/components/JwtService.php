<?php

namespace app\components;

use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Yii;
use app\models\RefreshToken;
use app\models\User;
use yii\base\Component;
use yii\base\InvalidConfigException;

class JwtService extends Component
{
    public string $secret = '';
    public string $issuer = 'leitner-api';
    public string $algorithm = 'HS256';
    public int $accessTtl = 3600;
    public int $refreshTtl = 2592000;

    public function init(): void
    {
        parent::init();

        $params = Yii::$app->params['jwt'] ?? [];
        $this->secret = $this->secret ?: (string) ($params['secret'] ?? '');
        $this->issuer = $params['issuer'] ?? $this->issuer;
        $this->algorithm = $params['algorithm'] ?? $this->algorithm;
        $this->accessTtl = (int) ($params['accessTtl'] ?? $this->accessTtl);
        $this->refreshTtl = (int) ($params['refreshTtl'] ?? $this->refreshTtl);

        if (strlen($this->secret) < 32) {
            throw new InvalidConfigException('JWT_SECRET must be at least 32 characters long.');
        }
    }

    public function issueAccessToken(User $user): string
    {
        $now = time();

        return JWT::encode([
            'iss' => $this->issuer,
            'iat' => $now,
            'exp' => $now + $this->accessTtl,
            'uid' => $user->id,
            'jti' => Yii::$app->security->generateRandomString(16),
        ], $this->secret, $this->algorithm);
    }

    /**
     * Issues an opaque refresh token and stores only its hash, so it can be revoked later.
     */
    public function issueRefreshToken(User $user): string
    {
        $token = Yii::$app->security->generateRandomString(64);

        $record = new RefreshToken([
            'user_id' => $user->id,
            'token_hash' => $this->hashRefreshToken($token),
            'expires_at' => time() + $this->refreshTtl,
        ]);

        if (!$record->save()) {
            throw new \RuntimeException('Unable to persist refresh token.');
        }

        return $token;
    }

    public function issuePair(User $user): array
    {
        return [
            'access_token' => $this->issueAccessToken($user),
            'refresh_token' => $this->issueRefreshToken($user),
            'token_type' => 'Bearer',
            'expires_in' => $this->accessTtl,
        ];
    }

    public function hashRefreshToken(string $token): string
    {
        return hash_hmac('sha256', $token, $this->secret);
    }

    /**
     * Verifies signature and expiry; returns the decoded payload or null when invalid.
     */
    public function parse(string $jwt): ?object
    {
        try {
            $payload = JWT::decode($jwt, new Key($this->secret, $this->algorithm));
        } catch (ExpiredException) {
            return null;
        } catch (\Throwable) {
            return null;
        }

        if (($payload->iss ?? null) !== $this->issuer || empty($payload->uid)) {
            return null;
        }

        return $payload;
    }

    public function revokeRefreshToken(string $token): bool
    {
        $record = RefreshToken::findUsable($this->hashRefreshToken($token));

        if ($record === null) {
            return false;
        }

        $record->revoked_at = time();

        return (bool) $record->save(false, ['revoked_at']);
    }

    public function revokeAllForUser(int $userId): int
    {
        return RefreshToken::updateAll(
            ['revoked_at' => time()],
            ['user_id' => $userId, 'revoked_at' => null]
        );
    }
}
