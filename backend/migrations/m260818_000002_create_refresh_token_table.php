<?php

use yii\db\Migration;

class m260818_000002_create_refresh_token_table extends Migration
{
    public function safeUp(): void
    {
        $this->createTable('{{%refresh_token}}', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'token_hash' => $this->string(255)->notNull(),
            'expires_at' => $this->integer()->notNull(),
            'revoked_at' => $this->integer()->null(),
            'created_at' => $this->integer()->notNull(),
        ]);

        $this->createIndex('idx-refresh_token-token_hash', '{{%refresh_token}}', 'token_hash', true);
        $this->createIndex('idx-refresh_token-user_id', '{{%refresh_token}}', 'user_id');

        $this->addForeignKey(
            'fk-refresh_token-user_id',
            '{{%refresh_token}}',
            'user_id',
            '{{%user}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
    }

    public function safeDown(): void
    {
        $this->dropTable('{{%refresh_token}}');
    }
}
