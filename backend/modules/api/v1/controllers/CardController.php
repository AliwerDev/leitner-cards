<?php

namespace app\modules\api\v1\controllers;

use Yii;
use app\models\Card;
use yii\data\ActiveDataProvider;
use yii\filters\VerbFilter;
use yii\web\NotFoundHttpException;

class CardController extends BaseApiController
{
    public function behaviors(): array
    {
        return array_merge(parent::behaviors(), [
            'verbs' => [
                'class' => VerbFilter::class,
                'actions' => [
                    'index'  => ['GET', 'HEAD'],
                    'view'   => ['GET', 'HEAD'],
                    'create' => ['POST'],
                    'update' => ['PUT', 'PATCH'],
                    'delete' => ['DELETE'],
                ],
            ],
        ]);
    }

     // GET /api/v1/cards/?deckId=23
    public function actionIndex(int $deckId): ActiveDataProvider
    {
        return new ActiveDataProvider([
            'query' => Card::find()
                ->where(['deck_id' => $deckId])
                ->orderBy(['created_at' => SORT_DESC]),
            'pagination' => ['pageSize' => 20],
        ]);
    }

     // GET /api/v1/cards/23
    public function actionView(int $id): array
    {       
        return  ['card' => $this->findCard($id)->toArray()];
    }

     // POST /api/v1/cards
    public function actionCreate(int $deckId): array
    {
        $card = new Card();
        $card->load(Yii::$app->request->getBodyParams(), '');
        $card->deck_id = $deckId;

        if (!$card->save()) {
            return $this->validationError($card->getErrors());
        }

        Yii::$app->response->statusCode = 201;

        return ['card' => $card->toArray()];
    }

    // PATCH, PUT /api/v1/cards
    public function actionUpdate(int $id): array
    {
        $card = $this->findCard($id);
        $card->load(Yii::$app->request->getBodyParams(), '');

        if (!$card->save()) {
            return $this->validationError($card->getErrors());
        }

        return ['card' => $card->toArray()];
    }

    public function actionDelete(int $id): array
    {
        $this->findCard($id)->delete();
        
        return ["message" => "Card deleted successfully!"];
    }

     /**
     * Loads a deck owned by the current user, or fails with 404.
     */
    private function findCard(int $id): Card
    {
        $card = Card::findOne(['id' => $id]);

        if ($card === null) {
            throw new NotFoundHttpException('Card not found.');
        }

        return $card;
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
