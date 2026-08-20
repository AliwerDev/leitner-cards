<?php

namespace app\modules\api\v1\controllers;

use Yii;
use app\models\Deck;
use app\services\QuotaService;
use app\services\ReviewService;
use yii\data\ActiveDataProvider;
use yii\filters\VerbFilter;

class DeckController extends BaseApiController
{
    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'index'  => ['GET', 'HEAD'],
                    'view'   => ['GET', 'HEAD'],
                    'stats'  => ['GET', 'HEAD'],
                    'create' => ['POST'],
                    'update' => ['PUT', 'PATCH'],
                    'delete' => ['DELETE'],
                ],
            ],
        ]);
    }

    // GET /api/v1/decks
    public function actionIndex(): ActiveDataProvider
    {
        return new ActiveDataProvider([
            'query' => Deck::find()
                ->where(['user_id' => Yii::$app->user->id])
                ->orderBy(['created_at' => SORT_DESC]),
            'pagination' => ['pageSize' => 20],
        ]);
    }

    // GET /api/v1/decks/5
    public function actionView(int $id): array
    {
        return ['deck' => Deck::findDeck($id)->toArray()];
    }

    // GET /api/v1/decks/5/stats
    public function actionStats(int $id): array
    {
        $deck = Deck::findDeck($id);

        return [
            'deck' => $deck->toArray(),
            'stats' => (new ReviewService())->stats((int) Yii::$app->user->id, $deck->id),
        ];
    }

    // POST /api/v1/decks
    public function actionCreate(): array
    {
        $userId = (int) Yii::$app->user->id;
        $quota = new QuotaService();

        if (!$quota->canCreateDeck($userId)) {
            return $this->validationError($quota->deckLimitError($userId));
        }

        $deck = new Deck();
        $deck->load(Yii::$app->request->getBodyParams(), '');
        $deck->user_id = Yii::$app->user->id;

        if (!$deck->save()) {
            return $this->validationError($deck->getErrors());
        }

        Yii::$app->response->statusCode = 201;

        return ['deck' => $deck->toArray()];
    }

    /**
     * PUT, PATCH /api/v1/decks/5
     *
     * user_id is re-pinned after load(): it is a safe attribute, so a body that
     * carries one would otherwise transfer the deck to another account.
     */
    public function actionUpdate(int $id): array
    {
        $deck = Deck::findDeck($id);
        $deck->load(Yii::$app->request->getBodyParams(), '');
        $deck->user_id = Yii::$app->user->id;

        if (!$deck->save()) {
            return $this->validationError($deck->getErrors());
        }

        return ['deck' => $deck->toArray()];
    }

    // DELETE /api/v1/decks/5
    public function actionDelete(int $id): array
    {
        Deck::findDeck($id)->delete();

        return ['message' => 'Deck muvaffaqiyatli o\'chirildi.'];
    }
}
