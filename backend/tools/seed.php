<?php

/**
 * Test data seeder. Drives the real API controllers.
 *
 * Every write goes through the same routing, authentication filter, form
 * validation and JWT plumbing an HTTP client uses. Only nginx is absent, so the
 * 5-requests-per-minute limit on register and login does not apply and the whole
 * set seeds in seconds.
 *
 * Usage, from the repository root:
 *   docker compose exec php php tools/seed.php
 *   docker compose exec php php tools/seed.php --fresh
 *
 * --fresh deletes every user first. Deck, card, progress and history rows go
 * with them, because every foreign key into "user" cascades.
 */

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__, 2));
$dotenv->safeLoad();

defined('YII_DEBUG') or define('YII_DEBUG', true);
defined('YII_ENV') or define('YII_ENV', 'dev');

require __DIR__ . '/../vendor/yiisoft/yii2/Yii.php';

$config = require __DIR__ . '/../config/web.php';

// The web application expects these; the CLI SAPI provides neither.
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/../web/index.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SERVER_NAME'] = 'localhost';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

$app = new yii\web\Application($config);

/* -- The API client ------------------------------------------------------- */

/**
 * One request against the real application.
 *
 * A fresh Request, Response and User component is installed for every call so
 * that no route, body, status code or cached identity leaks into the next one.
 * The controller is resolved through urlManager, so the URL rules in
 * config/web.php are exercised too.
 *
 * @param array<string,mixed> $body
 * @param array<string,mixed> $query
 * @return array{status:int, data:mixed, error:mixed}
 */
function api(string $method, string $path, array $body = [], ?string $token = null, array $query = []): array
{
    Yii::$app->set('request', [
        'class' => yii\web\Request::class,
        'enableCookieValidation' => false,
        'enableCsrfValidation' => false,
        'parsers' => ['application/json' => yii\web\JsonParser::class],
    ]);
    Yii::$app->set('response', [
        'class' => yii\web\Response::class,
        'format' => yii\web\Response::FORMAT_JSON,
        'charset' => 'UTF-8',
    ]);

    // The identity is cached per request in the user component; a stale one
    // would authorise the next call as the previous account.
    Yii::$app->set('user', [
        'class' => yii\web\User::class,
        'identityClass' => app\models\User::class,
        'enableAutoLogin' => false,
        'enableSession' => false,
        'loginUrl' => null,
    ]);

    $request = Yii::$app->request;

    $headers = $request->getHeaders();
    $headers->set('Accept', 'application/json');
    $headers->set('Content-Type', 'application/json');

    if ($token !== null) {
        $headers->set('Authorization', 'Bearer ' . $token);
    }

    $_SERVER['REQUEST_METHOD'] = strtoupper($method);
    $_SERVER['REQUEST_URI'] = '/' . ltrim($path, '/');

    $route = Yii::$app->urlManager->parseRequest($request);

    if ($route === false) {
        throw new RuntimeException("No route matched {$method} {$path}");
    }

    [$routePath, $routeParams] = $route;

    $params = $routeParams + $query;
    $request->setQueryParams($params);
    $request->setBodyParams($body);

    try {
        /*
         * The params must be handed to runAction explicitly. In a real request
         * Application::handleRequest() takes them from Request::resolve() and
         * passes them on; calling runAction directly skips that step, so an
         * action argument such as $deckId would arrive null and the controller
         * would answer 422.
         */
        $result = Yii::$app->runAction($routePath, $params);
        $status = Yii::$app->response->statusCode;

        if ($result instanceof yii\data\ActiveDataProvider) {
            $serializer = new yii\rest\Serializer([
                'request' => $request,
                'response' => Yii::$app->response,
            ]);
            $result = $serializer->serialize($result);
        }

        if (is_array($result) && array_key_exists('success', $result)) {
            return ['status' => $status, 'data' => $result['data'], 'error' => $result['error']];
        }

        return ['status' => $status, 'data' => $result, 'error' => null];
    } catch (\Throwable $e) {
        $status = $e instanceof yii\web\HttpException ? $e->statusCode : 500;

        return ['status' => $status, 'data' => null, 'error' => ['message' => $e->getMessage()]];
    }
}

/** Aborts loudly: a half-seeded database is worse than none. */
function ok(array $response, string $what): mixed
{
    if ($response['status'] >= 400 || $response['error'] !== null) {
        $detail = json_encode($response['error'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        fwrite(STDERR, "FAILED [{$response['status']}] {$what}: {$detail}\n");
        exit(1);
    }

    return $response['data'];
}

function say(string $line): void
{
    echo $line . "\n";
}

/* -- Content ---------------------------------------------------------------
   Real vocabulary rather than "card 1 / card 2", so the review screens and the
   admin tables are readable while testing. */

$topics = [
    ['name' => 'Ingliz tili - asosiy fe\'llar', 'color' => 1, 'cards' => [
        ['to run', 'yugurmoq'], ['to write', 'yozmoq'], ['to speak', 'gapirmoq'],
        ['to listen', 'tinglamoq'], ['to build', 'qurmoq'], ['to choose', 'tanlamoq'],
        ['to bring', 'olib kelmoq'], ['to teach', 'o\'qitmoq'], ['to learn', 'o\'rganmoq'],
        ['to remember', 'eslamoq'], ['to forget', 'esdan chiqarmoq'], ['to explain', 'tushuntirmoq'],
    ]],
    ['name' => 'Ingliz tili - ofis lug\'ati', 'color' => 2, 'cards' => [
        ['deadline', 'muddat'], ['meeting', 'yig\'ilish'], ['invoice', 'hisob-faktura'],
        ['salary', 'ish haqi'], ['contract', 'shartnoma'], ['employee', 'xodim'],
        ['manager', 'menejer'], ['report', 'hisobot'], ['budget', 'byudjet'],
        ['schedule', 'jadval'],
    ]],
    ['name' => 'Nemis tili - kundalik so\'zlar', 'color' => 3, 'cards' => [
        ['das Haus', 'uy'], ['die Arbeit', 'ish'], ['der Freund', 'do\'st'],
        ['das Wasser', 'suv'], ['die Stadt', 'shahar'], ['der Tag', 'kun'],
        ['die Nacht', 'tun'], ['das Buch', 'kitob'], ['die Sprache', 'til'],
    ]],
    ['name' => 'Biologiya - hujayra', 'color' => 4, 'cards' => [
        ['Mitoxondriya', 'Hujayraning energiya manbasi'],
        ['Ribosoma', 'Protein sintez qiluvchi organoid'],
        ['Yadro', 'DNK saqlanadigan joy'],
        ['Sitoplazma', 'Hujayra ichidagi suyuqlik'],
        ['Membrana', 'Hujayrani o\'rab turuvchi qobiq'],
        ['Xloroplast', 'Fotosintez amalga oshadigan organoid'],
        ['Lizosoma', 'Hazm qiluvchi ferment saqlaydi'],
    ]],
    ['name' => 'Tarix - Amir Temur davri', 'color' => 5, 'cards' => [
        ['Amir Temur tug\'ilgan yil', '1336'],
        ['Temuriylar davlati poytaxti', 'Samarqand'],
        ['Ankara jangi yili', '1402'],
        ['Registon majmuasi shahri', 'Samarqand'],
        ['Temurning otasi', 'Amir Tarag\'ay'],
        ['Ulug\'bek rasadxonasi qurilgan asr', 'XV asr'],
    ]],
    ['name' => 'Matematika - formulalar', 'color' => 6, 'cards' => [
        ['Aylana yuzasi', 'S = pi * r^2'],
        ['Aylana uzunligi', 'L = 2 * pi * r'],
        ['Pifagor teoremasi', 'a^2 + b^2 = c^2'],
        ['Uchburchak yuzasi', 'S = (a * h) / 2'],
        ['Kvadrat tenglama diskriminanti', 'D = b^2 - 4ac'],
    ]],
    ['name' => 'Geografiya - paytaxtlar', 'color' => 7, 'cards' => [
        ['Yaponiya', 'Tokio'], ['Braziliya', 'Braziliya'], ['Kanada', 'Ottava'],
        ['Avstraliya', 'Kanberra'], ['Turkiya', 'Anqara'], ['Misr', 'Qohira'],
        ['Norvegiya', 'Oslo'], ['Hindiston', 'Dehli'],
    ]],
    ['name' => 'IT - tarmoq atamalari', 'color' => 8, 'cards' => [
        ['HTTP', 'Gipermatn uzatish protokoli'],
        ['DNS', 'Domen nomlarini IP ga aylantiruvchi tizim'],
        ['TCP', 'Ishonchli ulanishli uzatish protokoli'],
        ['TLS', 'Trafikni shifrlash protokoli'],
        ['CDN', 'Kontentni tarqatish tarmogi'],
        ['Proxy', 'Vositachi server'],
        ['Firewall', 'Tarmoq filtri'],
    ]],
];

/**
 * The accounts.
 *
 * `decks` indexes into $topics. Regular accounts stay at three decks or fewer,
 * because QuotaService rejects the fourth. `activity` scales how much of each
 * deck gets reviewed, so the dashboard shows a spread rather than one flat line.
 */
$people = [
    ['username' => 'admin', 'email' => 'admin@leitner.uz', 'password' => 'admin12345',
     'role' => 10, 'type' => 10, 'status' => 10, 'decks' => [0, 1, 7], 'activity' => 0.9],

    ['username' => 'alisher', 'email' => 'alisher@example.uz', 'password' => 'parol12345',
     'role' => 10, 'type' => 10, 'status' => 10, 'decks' => [0, 3, 4, 5], 'activity' => 0.8],

    ['username' => 'dilnoza', 'email' => 'dilnoza@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 10, 'status' => 10, 'decks' => [0, 1, 2, 6], 'activity' => 0.95],
    ['username' => 'bekzod', 'email' => 'bekzod@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 10, 'status' => 10, 'decks' => [3, 5, 7], 'activity' => 0.7],
    ['username' => 'sevara', 'email' => 'sevara@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 10, 'status' => 10, 'decks' => [1, 4, 6], 'activity' => 0.6],

    ['username' => 'jasur', 'email' => 'jasur@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [0, 2], 'activity' => 0.75],
    ['username' => 'nilufar', 'email' => 'nilufar@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [3, 4, 5], 'activity' => 0.5],
    ['username' => 'rustam', 'email' => 'rustam@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [6, 7], 'activity' => 0.4],
    ['username' => 'kamola', 'email' => 'kamola@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [0, 1, 6], 'activity' => 0.85],
    ['username' => 'shohruh', 'email' => 'shohruh@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [2, 3], 'activity' => 0.3],
    ['username' => 'zarina', 'email' => 'zarina@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [4, 7], 'activity' => 0.65],
    ['username' => 'iskandar', 'email' => 'iskandar@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [5], 'activity' => 0.55],
    ['username' => 'madina', 'email' => 'madina@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [0, 6, 7], 'activity' => 0.7],
    ['username' => 'temur', 'email' => 'temur@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [1, 4], 'activity' => 0.45],
    ['username' => 'gulnora', 'email' => 'gulnora@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [2, 3, 5], 'activity' => 0.6],

    // Never studied: the level histogram must show these as "boshlanmagan".
    ['username' => 'sardor', 'email' => 'sardor@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [0], 'activity' => 0.0],
    // No decks at all: exercises the empty state.
    ['username' => 'yulduz', 'email' => 'yulduz@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 10, 'decks' => [], 'activity' => 0.0],

    // Blocked and soft-deleted, for the admin status filter.
    ['username' => 'aziza', 'email' => 'aziza@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 5, 'decks' => [1], 'activity' => 0.5],
    ['username' => 'farrux', 'email' => 'farrux@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 5, 'decks' => [3, 6], 'activity' => 0.35],
    ['username' => 'oybek', 'email' => 'oybek@example.uz', 'password' => 'parol12345',
     'role' => 1, 'type' => 1, 'status' => 0, 'decks' => [2], 'activity' => 0.4],
];

/* -- Run ------------------------------------------------------------------ */

$fresh = in_array('--fresh', $argv, true);

if ($fresh) {
    // Cascades through deck, card, card_progress, review_history and
    // refresh_token - every foreign key into "user" is ON DELETE CASCADE.
    $removed = Yii::$app->db->createCommand()->delete('{{%user}}')->execute();
    say("--fresh: {$removed} ta foydalanuvchi va ularga bogliq barcha malumot ochirildi.");
}

// A fixed seed keeps two runs of the seeder comparable.
mt_srand(20260821);

$now = time();
$day = 86400;
$totals = ['users' => 0, 'decks' => 0, 'cards' => 0, 'reviews' => 0];

foreach ($people as $person) {
    // Registration is the public path, exactly as a real client uses it.
    $auth = ok(api('POST', '/api/v1/auth/register', [
        'username' => $person['username'],
        'email' => $person['email'],
        'password' => $person['password'],
    ]), "register {$person['username']}");

    $token = $auth['access_token'];
    $userId = $auth['user']['id'];
    $totals['users']++;

    /*
     * type, role and status have no endpoint yet - that is exactly what the
     * planned admin API adds. Until then the columns are set directly, which is
     * what the README instructs.
     *
     * This runs BEFORE the decks are created, not after: QuotaService caps a
     * Regular account at three decks, so a Premium account that is still
     * Regular at this point would be rejected on its fourth.
     *
     * status stays ACTIVE for now. findIdentity() filters on ACTIVE, so a
     * blocked account cannot use its own token, and the seeding below would
     * fail with 401. It is applied at the end instead.
     */
    $columns = [];

    if ($person['type'] !== 1) {
        $columns['type'] = $person['type'];
    }

    if ($person['role'] !== 1) {
        $columns['role'] = $person['role'];
    }

    if ($columns !== []) {
        Yii::$app->db->createCommand()->update('{{%user}}', $columns, ['id' => $userId])->execute();
    }

    $deckCount = 0;
    $cardCount = 0;
    $reviewCount = 0;

    foreach ($person['decks'] as $topicIndex) {
        $topic = $topics[$topicIndex];

        $deck = ok(api('POST', '/api/v1/decks', [
            'name' => $topic['name'],
            'description' => sprintf('%d ta karta. Test uchun.', count($topic['cards'])),
            'color' => $topic['color'],
            'direction' => $topicIndex % 3 === 0 ? 2 : 1,
        ], $token), "create deck for {$person['username']}")['deck'];

        $deckCount++;

        $rows = array_map(
            static fn(array $pair): array => ['front' => $pair[0], 'back' => $pair[1]],
            $topic['cards']
        );

        $bulk = ok(api('POST', '/api/v1/cards/bulk', [
            'deckId' => $deck['id'],
            'cards' => $rows,
        ], $token), "bulk cards for {$person['username']}");

        $cardCount += $bulk['created'];

        if ($person['activity'] <= 0.0) {
            continue;
        }

        /*
         * A study history, replayed over the last 30 days.
         *
         * POST /api/v1/reviews is the endpoint the study screen uses, and it
         * always answers "now". That is correct for the product and useless
         * here: a card promoted to level 2 is rescheduled two days out, so a
         * second pass today finds nothing due and every card stops at level 2.
         * Climbing the ladder needs time to pass between answers.
         *
         * So the replay calls ReviewService::recordAnswer() with an explicit
         * timestamp. It is the same method the controller calls, with the same
         * ownership check, the same transaction and the same scheduling - only
         * the clock is a parameter instead of time(). The history rows and the
         * progress rows therefore agree with each other, which is what the
         * level histogram and the due-cards query read.
         */
        $reviews = new app\services\ReviewService();
        $cards = ok(api('GET', '/api/v1/cards', [], $token, [
            'deckId' => $deck['id'],
            'per-page' => 100,
        ]), "list cards for {$person['username']}");

        foreach ($cards as $card) {
            // Not every card in a deck gets touched.
            if (mt_rand(1, 100) > $person['activity'] * 100) {
                continue;
            }

            /*
             * When this card was first studied. The window is wide on purpose:
             * the Leitner intervals grow (0, 2, 3, 7, 15, 31, 61 days), so a
             * card that started three months ago can reach the top of the
             * ladder while one from last week is still near the bottom. A
             * narrow window marches every card to the same level and the
             * histogram collapses into one bar.
             */
            $at = $now - mt_rand(3, 150) * $day;
            $accuracy = (int) (55 + $person['activity'] * 35);

            /*
             * Where the replay stops.
             *
             * About a third of the cards stop answering some days before today,
             * so their next review has already come round and they appear on the
             * study screen. The rest are answered right up to now and sit with a
             * future schedule. Without the early cutoff every card is current,
             * nothing is ever due, and the study screen - the one screen this
             * data most needs to exercise - is empty.
             */
            $stopAt = mt_rand(1, 100) <= 35
                ? $now - mt_rand(2, 40) * $day
                : $now;

            while ($at <= $stopAt) {
                $wasCorrect = mt_rand(1, 100) <= $accuracy;
                $result = $reviews->recordAnswer($userId, (int) $card['id'], $wasCorrect, $at);
                $reviewCount++;

                $nextAt = $result->progress->next_review_at;

                // NULL means mastered: nothing further is scheduled.
                if ($nextAt === null) {
                    break;
                }

                // Answered a little late, as a real person would be.
                $at = (int) $nextAt + mt_rand(0, (int) ($day * 0.4));
            }
        }
    }

    /*
     * status last: the account needed to be ACTIVE to seed its own decks,
     * because findIdentity() resolves an access token only for an active user.
     */
    if ($person['status'] !== 10) {
        Yii::$app->db->createCommand()
            ->update('{{%user}}', ['status' => $person['status']], ['id' => $userId])
            ->execute();
    }

    $totals['decks'] += $deckCount;
    $totals['cards'] += $cardCount;
    $totals['reviews'] += $reviewCount;

    $flags = [];

    if ($person['role'] === 10) {
        $flags[] = 'ADMIN';
    }

    if ($person['type'] === 10) {
        $flags[] = 'Premium';
    }

    if ($person['status'] === 5) {
        $flags[] = 'Nofaol';
    }

    if ($person['status'] === 0) {
        $flags[] = 'Ochirilgan';
    }

    say(sprintf(
        '  %-10s id=%-3d %d deck, %3d karta, %3d takrorlash%s',
        $person['username'],
        $userId,
        $deckCount,
        $cardCount,
        $reviewCount,
        $flags === [] ? '' : ' [' . implode(', ', $flags) . ']'
    ));
}

say('');
say(sprintf(
    'Tayyor: %d foydalanuvchi, %d deck, %d karta, %d takrorlash.',
    $totals['users'],
    $totals['decks'],
    $totals['cards'],
    $totals['reviews']
));
say('');
say('Kirish: admin / admin12345   (yoki alisher / parol12345)');
say('Qolgan hisoblar paroli: parol12345');
