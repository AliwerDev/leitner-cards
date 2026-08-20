<?php

namespace app\modules\api\v1\models;

use yii\base\Model;

/**
 * Body of POST /api/v1/reviews.
 */
class ReviewForm extends Model
{
    public $cardId;
    public $wasCorrect;

    public function rules(): array
    {
        return [
            [['cardId', 'wasCorrect'], 'required'],
            [['cardId'], 'integer', 'min' => 1],
            [['wasCorrect'], 'boolean'],
        ];
    }

    public function attributeLabels(): array
    {
        return [
            'cardId' => 'Karta',
            'wasCorrect' => 'Javob to\'g\'ri',
        ];
    }

    public function cardId(): int
    {
        return (int) $this->cardId;
    }

    /** The boolean validator accepts "1"/"true"/0 - normalise before use. */
    public function isCorrect(): bool
    {
        return filter_var($this->wasCorrect, FILTER_VALIDATE_BOOLEAN);
    }
}
