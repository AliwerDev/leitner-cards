<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%deck}}`.
 */
class m260818_073033_create_deck_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%deck}}', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'name' => $this->string(255)->notNull(),
            'description' => $this->text()->null(),
            'created_at' => $this->integer()->notNull(),
            'updated_at' => $this->integer()->notNull(),
        ]);
        
        $this->createIndex('idx-deck-user_id', '{{%deck}}', 'user_id');

        $this->addForeignKey(
            'fk-deck-user_id',
            '{{%deck}}', 'user_id',
            '{{%user}}', 'id',
            'CASCADE', 'CASCADE'
        );
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('{{%deck}}');
    }
}
