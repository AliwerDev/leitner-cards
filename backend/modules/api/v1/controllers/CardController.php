<?php

namespace app\modules\api\v1\controllers;

use Yii;
use app\models\Card;
use app\models\Deck;
use app\models\ReviewHistory;
use app\services\QuotaService;
use app\services\ReviewService;
use yii\data\ActiveDataProvider;
use yii\filters\VerbFilter;

class CardController extends BaseApiController
{
    /** Longest accepted `q` value. Keeps the query string within nginx buffers. */
    private const MAX_SEARCH_LENGTH = 255;

    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'index'    => ['GET', 'HEAD'],
                    'view'     => ['GET', 'HEAD'],
                    'progress' => ['GET', 'HEAD'],
                    'create'   => ['POST'],
                    'update'   => ['PUT', 'PATCH'],
                    'delete'   => ['DELETE'],
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/cards?deckId=23&q=kitob
     *
     * `q` filters on either side of the card, case-insensitively.
     */
    public function actionIndex(int $deckId, ?string $q = null): ActiveDataProvider|array
    {
        $deck = Deck::findDeck($deckId);
        $q = trim((string) $q);

        if (mb_strlen($q) > self::MAX_SEARCH_LENGTH) {
            return $this->validationError([
                'q' => [sprintf('Qidiruv matni %d belgidan oshmasligi kerak.', self::MAX_SEARCH_LENGTH)],
            ]);
        }

        $query = Card::find()
            ->where(['deck_id' => $deck->id])
            ->orderBy(['created_at' => SORT_DESC]);

        if ($q !== '') {
            // Escape the LIKE wildcards so a literal % or _ matches itself
            // instead of everything. Passing false keeps Yii from re-wrapping
            // the value, so the surrounding %...% is added here.
            $needle = '%' . addcslashes($q, '%_\\') . '%';

            $query->andWhere([
                'or',
                ['ilike', 'front', $needle, false],
                ['ilike', 'back', $needle, false],
            ]);
        }

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => ['pageSize' => 20],
        ]);
    }

    // GET /api/v1/cards/23
    public function actionView(int $id): array
    {
        return ['card' => Card::findOwned($id)->toArray()];
    }

    /**
     * POST /api/v1/cards   body: {deckId, front, back}
     *
     * deckId goes through Deck::findDeck() so a card cannot be planted in a
     * deck the caller does not own.
     */
    public function actionCreate(): array
    {
        $body = Yii::$app->request->getBodyParams();
        $deckId = (int) ($body['deckId'] ?? Yii::$app->request->getQueryParam('deckId'));
        $deck = Deck::findDeck($deckId);

        $userId = (int) Yii::$app->user->id;
        $quota = new QuotaService();

        if (!$quota->canAddCard($userId, $deck->id)) {
            return $this->validationError($quota->cardLimitError($userId));
        }

        $card = new Card();
        $card->load($body, '');
        $card->deck_id = $deck->id;

        if (!$card->save()) {
            return $this->validationError($card->getErrors());
        }

        Yii::$app->response->statusCode = 201;

        return ['card' => $card->toArray()];
    }

    /**
     * PATCH, PUT /api/v1/cards/23
     *
     * A card can be moved between decks, but only into another deck the caller
     * owns - deck_id is a safe attribute, so load() would otherwise accept any
     * deck id from the body and hand the card to a stranger.
     */
    public function actionUpdate(int $id): array
    {
        $card = Card::findOwned($id);
        $originalDeckId = $card->deck_id;

        $card->load(Yii::$app->request->getBodyParams(), '');

        if ((int) $card->deck_id !== (int) $originalDeckId) {
            $target = Deck::findDeck((int) $card->deck_id);
            $userId = (int) Yii::$app->user->id;
            $quota = new QuotaService();

            // Without this the card limit could be side-stepped by filling one
            // deck and moving the overflow into another.
            if (!$quota->canAddCard($userId, $target->id)) {
                return $this->validationError($quota->cardLimitError($userId));
            }

            $card->deck_id = $target->id;
        }

        if (!$card->save()) {
            return $this->validationError($card->getErrors());
        }

        return ['card' => $card->toArray()];
    }

    // DELETE /api/v1/cards/23
    public function actionDelete(int $id): array
    {
        Card::findOwned($id)->delete();

        return ['message' => 'Karta muvaffaqiyatli o\'chirildi.'];
    }

    /**
     * GET /api/v1/cards/23/progress
     *
     * Current Leitner state plus the most recent reviews. A card that has never
     * been studied reports the first level, due now, without creating a row.
     */
    public function actionProgress(int $id): array
    {
        $card = Card::findOwned($id);
        $userId = (int) Yii::$app->user->id;

        $progress = (new ReviewService())->progressFor($userId, $card);

        $history = ReviewHistory::find()
            ->where(['user_id' => $userId, 'card_id' => $card->id])
            ->orderBy(['reviewed_at' => SORT_DESC, 'id' => SORT_DESC])
            ->limit(20)
            ->all();

        return [
            'card' => $card->toArray(),
            'progress' => $progress->toArray(),
            'history' => array_map(fn(ReviewHistory $h) => $h->toArray(), $history),
        ];
    }
}
