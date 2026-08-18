<?php

require_once __DIR__ . '/env.php';

return [
    'class' => yii\db\Connection::class,
    'dsn' => sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        env('DB_HOST', 'db'),
        env('DB_PORT', '5432'),
        env('DB_NAME', 'leitner')
    ),
    'username' => env('DB_USER', 'leitner'),
    'password' => env('DB_PASSWORD', 'secret'),
    'charset' => 'utf8',
    'enableSchemaCache' => !YII_DEBUG,
    'schemaCacheDuration' => 3600,
    'schemaCache' => 'cache',
];
