<?php

namespace app\modules\api\v1\controllers;

use Yii;
use app\models\Deck;
use yii\data\ActiveDataProvider;
use yii\filters\VerbFilter;
use yii\web\NotFoundHttpException;

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
                    'cards'   => ['GET', 'HEAD'],
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

    // GET /api/v1/decks/:id
    public function actionView(int $id): array
    {
        return ['deck' => $this->findDeck($id)->toArray()];
    }

    public function actionCards(int $id): array
    {
        $deck = $this->findDeck($id);

        return ["deck" => $deck->toArray(), 'cards' => $deck->cards];
    }

     // POST /api/v1/decks
    public function actionCreate(): array
    {
        $deck = new Deck();
        $deck->load(Yii::$app->request->getBodyParams(), '');
        $deck->user_id = Yii::$app->user->id;

        if (!$deck->save()) {
            return $this->validationError($deck->getErrors());
        }

        Yii::$app->response->statusCode = 201;

        return ['deck' => $deck->toArray()];
    }
    
    // PUT /api/v1/decks/5
    public function actionUpdate(int $id): array
    {
        $deck = $this->findDeck($id);
        $deck->load(Yii::$app->request->getBodyParams(), '');

        if (!$deck->save()) {
            return $this->validationError($deck->getErrors());
        }

        return ['deck' => $deck->toArray()];
    }

    // DELETE /api/v1/decks/5
    public function actionDelete(int $id): array
    {
        $this->findDeck($id)->delete();

        return ['message' => 'Deck deleted.'];
    }

    /**
     * Loads a deck owned by the current user, or fails with 404.
     */
    private function findDeck(int $id): Deck
    {
        $deck = Deck::findOne(['id' => $id, 'user_id' => Yii::$app->user->id]);

        if ($deck === null) {
            throw new NotFoundHttpException('Deck not found.');
        }

        return $deck;
    }

    private function validationError(array $errors): array
    {
        Yii::$app->response->statusCode = 422;

        return [
            'success' => false,
            'data' => null,
            'error' => [
                'code' => 422,
                'name' => 'Unprocessable Entity',
                'message' => 'Validation failed.',
                'fields' => $errors,
            ],
        ];
    }
}
