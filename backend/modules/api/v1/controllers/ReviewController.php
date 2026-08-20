<?php

namespace app\modules\api\v1\controllers;

use app\enums\CardLevel;
use app\models\Card;
use app\models\CardProgress;
use app\modules\api\v1\models\ReviewForm;
use app\services\ReviewService;
use Yii;
use yii\filters\VerbFilter;

/**
 * The study loop: what to review now, and recording answers.
 */
class ReviewController extends BaseApiController
{
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
                    'reset'  => ['POST'],
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/reviews/due?deckId=3&limit=10
     */
    public function actionDue(?int $deckId = null, int $limit = 20): array
    {
        $userId = (int) Yii::$app->user->id;
        $limit = max(1, min($limit, 100));

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
        $result = $this->reviews->recordAnswer($userId, $form->cardId(), $form->isCorrect());

        Yii::$app->response->statusCode = 201;

        return [
            'review' => $result->history->toArray(),
            'progress' => $result->progress->toArray(),
            'due_count' => $this->reviews->dueCount($userId),
        ];
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
