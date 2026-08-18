<?php

require_once __DIR__ . '/env.php';

return [
    'jwt' => [
        'secret' => env('JWT_SECRET', 'change-me-please-32-chars-minimum'),
        'issuer' => 'leitner-api',
        'algorithm' => 'HS256',
        'accessTtl' => 3600,
        'refreshTtl' => 60 * 60 * 24 * 30,
    ],
];
