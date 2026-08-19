<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%card_progress}}`.
 */
class m260819_065745_create_card_progress_table extends Migration
{
  /**
   * {@inheritdoc}
   */
  public function safeUp()
  {
    $this->createTable("{{%card_progress}}", [
      "id" => $this->primaryKey(),
      "user_id" => $this->integer()->notNull(),
      "card_id" => $this->integer()->notNull(),
      "current_level" => $this->integer()->notNull(),
      "last_reviewed_at" => $this->date()->notNull(),
      "next_review_at" => $this->date()->notNull(),
    ]);

    $this->createIndex("idx-card_progress-card_id", "{{%card_progress}}", [
      "user_id",
      "card_id",
    ]);

    $this->addForeignKey(
      "idx-card_progress-card_id",
      "{{%card_progress}}",
      "card_id",
      "{{%card}}",
      "id",
      "CASCADE",
      "CASCADE"
    );

    $this->addForeignKey(
      "idx-card_progress-user_id",
      "{{%card_progress}}",
      "user_id",
      "{{%user}}",
      "id",
      "CASCADE",
      "CASCADE"
    );
  }

  /**
   * {@inheritdoc}
   */
  public function safeDown()
  {
    $this->dropTable("{{%card_progress}}");
  }
}
