<?php

namespace app\modules\api\v1\controllers;

use app\enums\CardLevel;
use app\models\Card;
use app\models\CardProgress;
use app\modules\api\v1\models\ReviewForm;
use app\services\ReviewService;
use Yii;
use yii\filters\VerbFilter;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

/**
 * The study loop: what to review now, and recording answers.
 */
class ReviewController extends BaseApiController
{
    /** Largest page the endpoint will build when the caller asks for one. */
    private const MAX_LIMIT = 100;

    /**
     * Ceiling on `limit=0`. A whole due queue is one response, so the size is
     * bounded by the number of cards rather than by a page size. `front` and
     * `back` accept 1000 characters each and `cardPayload()` repeats them as
     * `prompt` and `answer`, which puts the worst case near 4 KB per card. This
     * cap keeps the response under about 8 MB. Reaching it leaves cards behind,
     * and the client already handles that: a full queue means more are waiting.
     */
    private const ALL_LIMIT_CAP = 2000;

    /**
     * Largest batch accepted in one flush request.
     *
     * The outbox caps at 500 entries, so a worst-case flush is four requests.
     * Each item takes a row lock on the card's progress, which makes a batch a
     * transaction budget as much as a payload one: 100 keeps the longest
     * lock-holding request inside a worker's timeout.
     */
    private const MAX_BATCH = 100;

    private ReviewService $reviews;

    public function init(): void
    {
        parent::init();

        $this->reviews = new ReviewService();
    }

    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'due'    => ['GET', 'HEAD'],
                    'count'  => ['GET', 'HEAD'],
                    'create' => ['POST'],
                    'batch'  => ['POST'],
                    'reset'  => ['POST'],
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/reviews/due?deckId=3&limit=10
     *
     * `limit=0` asks for the whole due queue, up to ALL_LIMIT_CAP.
     */
    public function actionDue(?int $deckId = null, int $limit = 20): array
    {
        $userId = (int) Yii::$app->user->id;
        $limit = $limit === 0
            ? self::ALL_LIMIT_CAP
            : max(1, min($limit, self::MAX_LIMIT));

        $cards = $this->reviews->dueCards($userId, $deckId, $limit);

        return [
            'count' => count($cards),
            'cards' => array_map(
                fn(Card $card) => $this->cardPayload($card, $this->reviews->progressOf($card)),
                $cards
            ),
        ];
    }

    /**
     * GET /api/v1/reviews/count?deckId=3
     */
    public function actionCount(?int $deckId = null): array
    {
        return [
            'due_count' => $this->reviews->dueCount((int) Yii::$app->user->id, $deckId),
        ];
    }

    /**
     * POST /api/v1/reviews   body: {cardId, wasCorrect}
     */
    public function actionCreate(): array
    {
        $form = new ReviewForm();
        $form->load(Yii::$app->request->getBodyParams(), '');

        if (!$form->validate()) {
            return $this->validationError($form->getErrors());
        }

        $userId = (int) Yii::$app->user->id;
        $result = $this->reviews->recordAnswer(
            $userId,
            $form->cardId(),
            $form->isCorrect(),
            $form->reviewedAt(),
            $form->clientId(),
        );

        /*
         * A duplicate is a SUCCESS, not a 409.
         *
         * The only caller that sends a clientId is an outbox retrying
         * something it is not sure landed. A 4xx there reads as "permanent
         * failure, drop it" - right by accident - or, worse, as a bug to be
         * retried forever. 200 with `duplicate: true` says exactly what
         * happened and still carries the due_count the badge needs.
         *
         * The field is present on every response, always false on the web
         * path, so the client has one shape rather than two.
         */
        Yii::$app->response->statusCode = $result->duplicate ? 200 : 201;

        return [
            'review' => $result->history->toArray(),
            'progress' => $result->progress->toArray(),
            'due_count' => $this->reviews->dueCount($userId),
            'duplicate' => $result->duplicate,
        ];
    }

    /**
     * POST /api/v1/reviews/batch   body: {reviews: [{cardId, wasCorrect, reviewedAt, clientId}, ...]}
     *
     * The flush path for the mobile outbox. Collapses what used to be one
     * request per queued answer into one request per hundred.
     *
     * PER ITEM, NOT ONE TRANSACTION. A single transaction across the batch
     * means one deleted card rolls back every good answer beside it, and
     * leaves the client no way to drop the ones that landed - it would have to
     * resend all of them forever, because the bad one never goes away. Each
     * item gets its own transaction inside recordAnswer(), and its own result.
     *
     * ORDER IS LOAD-BEARING. Two answers to the same card must apply
     * oldest-first or the ladder lands wrong: correct-then-wrong leaves the
     * card at level 1, wrong-then-correct at level 2. The client sends them in
     * order, and the sort below is a safety net - batching by card id rather
     * than by time is an easy mistake to make and an invisible one to debug.
     *
     * The HTTP status is 200 whenever the request itself was understood, even
     * when every item was rejected. The transport succeeded; the per-item
     * results carry the outcomes.
     */
    public function actionBatch(): array
    {
        $items = Yii::$app->request->getBodyParams()['reviews'] ?? null;

        if (!is_array($items) || $items === []) {
            return $this->validationError(['reviews' => ['Javoblar ro\'yxati bo\'sh.']]);
        }

        if (count($items) > self::MAX_BATCH) {
            return $this->validationError([
                'reviews' => ['Bir so\'rovda ' . self::MAX_BATCH . ' tadan ko\'p javob yuborib bo\'lmaydi.'],
            ]);
        }

        $userId = (int) Yii::$app->user->id;

        /*
         * Sort by reviewedAt, with the original position as the tiebreaker.
         * usort is not stable for equal keys, and items without a timestamp
         * must keep their relative order rather than being shuffled.
         */
        $ordered = [];

        foreach (array_values($items) as $index => $item) {
            $ordered[] = ['index' => $index, 'item' => $item];
        }

        usort($ordered, static function (array $a, array $b): int {
            $left = is_array($a['item']) ? (int) ($a['item']['reviewedAt'] ?? 0) : 0;
            $right = is_array($b['item']) ? (int) ($b['item']['reviewedAt'] ?? 0) : 0;

            return ($left <=> $right) ?: ($a['index'] <=> $b['index']);
        });

        $results = [];

        foreach ($ordered as $entry) {
            $results[] = $this->applyBatchItem($userId, $entry['item']);
        }

        return [
            // One count for the whole batch, not one per item: the client only
            // needs the number it should show, and recomputing it per answer
            // costs a COUNT query each time.
            'due_count' => $this->reviews->dueCount($userId),
            'results' => $results,
        ];
    }

    /**
     * One item's outcome, in the vocabulary the outbox needs.
     *
     * `status` is exactly three values because the client has exactly three
     * responses to it:
     *   applied / duplicate -> drop it, the answer is on the server
     *   rejected            -> drop it, it will never succeed
     *   failed              -> keep it, this may work later
     */
    private function applyBatchItem(int $userId, mixed $raw): array
    {
        if (!is_array($raw)) {
            return ['clientId' => null, 'status' => 'rejected', 'error' => 'Yaroqsiz format.'];
        }

        $form = new ReviewForm();
        $form->load($raw, '');
        $clientId = $form->clientId();

        if (!$form->validate()) {
            return [
                'clientId' => $clientId,
                'status' => 'rejected',
                'error' => 'Validation failed.',
                'fields' => $form->getErrors(),
            ];
        }

        try {
            $result = $this->reviews->recordAnswer(
                $userId,
                $form->cardId(),
                $form->isCorrect(),
                $form->reviewedAt(),
                $clientId,
            );

            return [
                'clientId' => $clientId,
                'status' => $result->duplicate ? 'duplicate' : 'applied',
                'level_after' => (int) $result->progress->current_level,
            ];
        } catch (NotFoundHttpException | ForbiddenHttpException) {
            // The card is gone, or it is not theirs. Retrying cannot change it.
            return ['clientId' => $clientId, 'status' => 'rejected', 'error' => 'Karta topilmadi.'];
        } catch (\Throwable $e) {
            // A deadlock or a transient database error. Worth another attempt.
            Yii::error($e, __METHOD__);

            return ['clientId' => $clientId, 'status' => 'failed', 'error' => 'Server xatosi.'];
        }
    }

    /**
     * POST /api/v1/reviews/reset   body: {cardId}
     */
    public function actionReset(): array
    {
        $cardId = (int) (Yii::$app->request->getBodyParams()['cardId'] ?? 0);

        if ($cardId < 1) {
            return $this->validationError(['cardId' => ['Karta tanlanmagan.']]);
        }

        $userId = (int) Yii::$app->user->id;
        $progress = $this->reviews->resetCard($userId, $cardId);

        return [
            'progress' => $progress->toArray(),
            'due_count' => $this->reviews->dueCount($userId),
        ];
    }

    /**
     * One card as the study client needs it: the card, which side is the prompt,
     * and its Leitner state. A never-studied card reports a synthetic first
     * level with `is_new` so the client has one uniform shape to render.
     */
    private function cardPayload(Card $card, ?CardProgress $progress): array
    {
        $direction = $card->deck->getDirection();

        $payload = $card->toArray();
        $payload['deck_id'] = $card->deck_id;
        $payload['direction'] = $direction->value;
        $payload['prompt'] = $card->{$direction->promptField()};
        $payload['answer'] = $card->{$direction->answerField()};

        if ($progress === null) {
            $first = CardLevel::first();

            $payload['progress'] = [
                'current_level' => $first->value,
                'level_label' => $first->label(),
                'is_mastered' => false,
                'last_reviewed_at' => null,
                'next_review_at' => null,
                'is_new' => true,
            ];

            return $payload;
        }

        $payload['progress'] = $progress->toArray() + ['is_new' => false];

        return $payload;
    }
}
