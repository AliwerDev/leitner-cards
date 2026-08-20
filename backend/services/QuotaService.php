<?php

namespace app\services;

use app\models\Card;
use app\models\Deck;
use app\models\User;
use yii\web\NotFoundHttpException;

/**
 * Account quotas. Regular accounts are capped by UserType; Premium is unlimited.
 *
 * The limits themselves live in UserType so that changing a tier is a one-line
 * edit in the enum, not a hunt through controllers.
 */
class QuotaService
{
    /**
     * @throws NotFoundHttpException when the user id does not exist
     */
    private function user(int $userId): User
    {
        $user = User::findOne(['id' => $userId]);

        if ($user === null) {
            throw new NotFoundHttpException('Foydalanuvchi topilmadi.');
        }

        return $user;
    }

    /**
     * Whether the user may create one more deck.
     */
    public function canCreateDeck(int $userId): bool
    {
        return $this->remainingDecks($userId) !== 0;
    }

    /**
     * Whether the deck may hold one more card.
     */
    public function canAddCard(int $userId, int $deckId): bool
    {
        return $this->remainingCards($userId, $deckId) !== 0;
    }

    /**
     * Decks the user may still create. NULL means unlimited.
     */
    public function remainingDecks(int $userId): ?int
    {
        $max = $this->user($userId)->getType()->maxDecks();

        if ($max === null) {
            return null;
        }

        $used = (int) Deck::find()->where(['user_id' => $userId])->count();

        return max(0, $max - $used);
    }

    /**
     * Cards the deck may still hold. NULL means unlimited.
     */
    public function remainingCards(int $userId, int $deckId): ?int
    {
        $max = $this->user($userId)->getType()->maxCardsPerDeck();

        if ($max === null) {
            return null;
        }

        $used = (int) Card::find()->where(['deck_id' => $deckId])->count();

        return max(0, $max - $used);
    }

    /**
     * Per-field error for a rejected deck create, shaped for validationError().
     */
    public function deckLimitError(int $userId): array
    {
        $max = $this->user($userId)->getType()->maxDecks();

        return [
            'name' => [
                sprintf(
                    'Deck limiti tugadi: oddiy foydalanuvchi uchun %d ta deck. Premium hisobda cheklov yo\'q.',
                    $max
                ),
            ],
        ];
    }

    /**
     * Per-field error for a rejected card create, shaped for validationError().
     */
    public function cardLimitError(int $userId): array
    {
        $max = $this->user($userId)->getType()->maxCardsPerDeck();

        return [
            'deckId' => [
                sprintf(
                    'Karta limiti tugadi: oddiy foydalanuvchi uchun har deckda %d ta karta. Premium hisobda cheklov yo\'q.',
                    $max
                ),
            ],
        ];
    }

    /**
     * Quota snapshot for the current account, for a settings or profile screen.
     */
    public function summary(int $userId): array
    {
        $type = $this->user($userId)->getType();
        $decksUsed = (int) Deck::find()->where(['user_id' => $userId])->count();

        return [
            'type' => $type->value,
            'type_label' => $type->label(),
            'is_unlimited' => $type->isUnlimited(),
            'max_decks' => $type->maxDecks(),
            'max_cards_per_deck' => $type->maxCardsPerDeck(),
            'decks_used' => $decksUsed,
            'decks_remaining' => $this->remainingDecks($userId),
        ];
    }
}
