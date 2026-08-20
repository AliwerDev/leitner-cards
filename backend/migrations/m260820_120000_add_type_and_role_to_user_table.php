<?php

use app\enums\UserRole;
use app\enums\UserType;
use yii\db\Migration;

/**
 * Adds the account tier (`type`) and the account role (`role`) to `{{%user}}`.
 *
 * `type` drives the deck and card quotas: Regular accounts are limited,
 * Premium accounts are not. `role` is set directly in the database for now.
 */
class m260820_120000_add_type_and_role_to_user_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn(
            '{{%user}}',
            'type',
            $this->smallInteger()->notNull()->defaultValue(UserType::Regular->value)
        );

        $this->addColumn(
            '{{%user}}',
            'role',
            $this->smallInteger()->notNull()->defaultValue(UserRole::User->value)
        );

        // Quota checks filter by owner, and admin lookups filter by role.
        $this->createIndex('idx-user-type', '{{%user}}', 'type');
        $this->createIndex('idx-user-role', '{{%user}}', 'role');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropIndex('idx-user-role', '{{%user}}');
        $this->dropIndex('idx-user-type', '{{%user}}');
        $this->dropColumn('{{%user}}', 'role');
        $this->dropColumn('{{%user}}', 'type');
    }
}
