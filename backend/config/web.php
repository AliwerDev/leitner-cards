<?php

require_once __DIR__ . "/env.php";

$params = require __DIR__ . "/params.php";
$db = require __DIR__ . "/db.php";

$config = [
  "id" => "leitner-api",
  "name" => "Leitner API",
  "basePath" => dirname(__DIR__),
  "bootstrap" => ["log"],
  "language" => "en-US",
  "timeZone" => "Asia/Tashkent",
  "aliases" => [
    "@bower" => "@vendor/bower-asset",
    "@npm" => "@vendor/npm-asset",
  ],
  "modules" => [
    "api" => [
      "class" => app\modules\api\Module::class,
    ],
  ],
  "components" => [
    "request" => [
      "cookieValidationKey" => env(
        "COOKIE_VALIDATION_KEY",
        "leitner-api-not-used"
      ),
      "enableCookieValidation" => false,
      "enableCsrfValidation" => false,
      "parsers" => [
        "application/json" => yii\web\JsonParser::class,
      ],
    ],
    "response" => [
      "class" => yii\web\Response::class,
      "format" => yii\web\Response::FORMAT_JSON,
      "charset" => "UTF-8",
      "on beforeSend" => function ($event) {
        /** @var yii\web\Response $response */
        $response = $event->sender;

        if (
          $response->data === null ||
          $response->format !== yii\web\Response::FORMAT_JSON
        ) {
          return;
        }

        // Wrap every JSON payload in a single envelope shape for web/mobile clients
        if (
          is_array($response->data) &&
          array_key_exists("success", $response->data)
        ) {
          return;
        }

        if ($response->isSuccessful) {
          $response->data = [
            "success" => true,
            "data" => $response->data,
            "error" => null,
          ];

          return;
        }

        $error = $response->data;
        $response->data = [
          "success" => false,
          "data" => null,
          "error" =>
            [
              "code" => $response->statusCode,
              "name" => $error["name"] ?? "Error",
              "message" => $error["message"] ?? "Unexpected error",
            ] + (isset($error["fields"]) ? ["fields" => $error["fields"]] : []),
        ];
      },
    ],
    "user" => [
      "identityClass" => app\models\User::class,
      "enableAutoLogin" => false,
      "enableSession" => false,
      "loginUrl" => null,
    ],
    "errorHandler" => [
      "class" => yii\web\ErrorHandler::class,
      "errorAction" => "api/v1/site/error",
    ],
    "jwt" => [
      "class" => app\components\JwtService::class,
    ],
    "cache" => [
      "class" => yii\caching\FileCache::class,
    ],
    "log" => [
      "traceLevel" => YII_DEBUG ? 3 : 0,
      "targets" => [
        [
          "class" => yii\log\FileTarget::class,
          "levels" => ["error", "warning"],
        ],
      ],
    ],
    "db" => $db,
    "urlManager" => [
      "enablePrettyUrl" => true,
      "showScriptName" => false,
      "enableStrictParsing" => false,
      "rules" => [
        "GET  api/v1/health" => "api/v1/site/health",
        "POST api/v1/auth/<action:[\w-]+>" => "api/v1/auth/<action>",
        "GET  api/v1/auth/<action:[\w-]+>" => "api/v1/auth/<action>",

        // Deck CRUD
        [
          "class" => yii\rest\UrlRule::class,
          "controller" => ["api/v1/deck"],
          "pluralize" => true,
          "extraPatterns" => [
            "GET {id}/stats" => "stats",
          ],
        ],

        // Bulk create. Must precede the card UrlRule below: with pluralize on,
        // that rule matches cards/<id> and would read "bulk" as an id.
        "POST api/v1/cards/bulk" => "api/v1/card/bulk",

        // Card CRUD
        [
          "class" => yii\rest\UrlRule::class,
          "controller" => ["api/v1/card"],
          "pluralize" => true,
          "extraPatterns" => [
            "GET {id}/progress" => "progress",
          ],
        ],

        // Review loop. Explicit rules, not a rest\UrlRule: pluralize would also
        // generate GET /reviews/{id} and swallow /reviews/due as an id.
        "GET  api/v1/reviews/due" => "api/v1/review/due",
        "GET  api/v1/reviews/count" => "api/v1/review/count",
        "POST api/v1/reviews/reset" => "api/v1/review/reset",
        "POST api/v1/reviews" => "api/v1/review/create",

        // The daily rule precedes the bare one so /stats/daily is not parsed
        // as a parameter of /stats.
        "GET  api/v1/stats/daily" => "api/v1/stats/daily",
        "GET  api/v1/stats" => "api/v1/stats/index",
      ],
    ],
  ],
  "params" => $params,
];

return $config;
