<?php

namespace app\modules\api\v1\models;

use app\models\Card;
use yii\base\Model;

/**
 * Body of POST /api/v1/cards/bulk.
 *
 * The client splits the pasted text into rows, so this form receives an array
 * of {front, back} pairs. Each row is validated through Card::rules() rather
 * than a copy of the length limits, so the two paths cannot drift apart.
 */
class CardBulkForm extends Model
{
    /** Rows accepted in one request. Mirrored by MAX_BULK_ROWS on the client. */
    public const MAX_ROWS = 200;

    public $deckId;
    public $cards;

    public function rules(): array
    {
        return [
            [['deckId', 'cards'], 'required'],
            [['deckId'], 'integer', 'min' => 1],
            [['cards'], 'validateCards'],
        ];
    }

    public function attributeLabels(): array
    {
        return [
            'deckId' => 'Deck',
            'cards' => 'Kartalar',
        ];
    }

    /**
     * Checks the row array itself, then every row against Card::rules().
     *
     * Row errors are keyed as cards.0.front so the client can name the line
     * that failed instead of rejecting the whole paste without a reason.
     */
    public function validateCards(string $attribute): void
    {
        $rows = $this->$attribute;

        if (!is_array($rows)) {
            $this->addError($attribute, 'Kartalar ro\'yxati noto\'g\'ri.');

            return;
        }

        if ($rows === []) {
            $this->addError($attribute, 'Hech bo\'lmasa bitta karta kerak.');

            return;
        }

        if (count($rows) > self::MAX_ROWS) {
            $this->addError($attribute, sprintf(
                'Bir vaqtda ko\'pi bilan %d ta karta qo\'shish mumkin.',
                self::MAX_ROWS
            ));

            return;
        }

        foreach ($rows as $index => $row) {
            if (!is_array($row)) {
                $this->addError(sprintf('%s.%d', $attribute, $index), 'Karta noto\'g\'ri.');

                continue;
            }

            $card = new Card();
            $card->front = $row['front'] ?? null;
            $card->back = $row['back'] ?? null;

            if ($card->validate(['front', 'back'])) {
                continue;
            }

            foreach ($card->getErrors() as $field => $messages) {
                $this->addError(sprintf('%s.%d.%s', $attribute, $index, $field), $messages[0]);
            }
        }
    }

    /**
     * The validated rows, trimmed, ready for insert.
     *
     * Call only after validate() returns true.
     *
     * @return array<int, array{front: string, back: string}>
     */
    public function rows(): array
    {
        $rows = [];

        foreach ($this->cards as $row) {
            $rows[] = [
                'front' => trim((string) $row['front']),
                'back' => trim((string) $row['back']),
            ];
        }

        return $rows;
    }
}
