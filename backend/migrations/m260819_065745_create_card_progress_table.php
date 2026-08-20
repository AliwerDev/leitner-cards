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
      "current_level" => $this->integer()->notNull()->defaultValue(1),
      "last_reviewed_at" => $this->integer()->null(),
      "next_review_at" => $this->integer()->null(),
      "created_at" => $this->integer()->notNull(),
      "updated_at" => $this->integer()->notNull(),
    ]);

    $this->createIndex(
      "idx-card_progress-user_id-card_id",
      "{{%card_progress}}",
      ["user_id", "card_id"],
      true
    );

    $this->createIndex(
      "idx-card_progress-user_id-next_review_at",
      "{{%card_progress}}",
      ["user_id", "next_review_at"]
    );

    $this->addForeignKey(
      "fk-card_progress-card_id",
      "{{%card_progress}}",
      "card_id",
      "{{%card}}",
      "id",
      "CASCADE",
      "CASCADE"
    );

    $this->addForeignKey(
      "fk-card_progress-user_id",
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
    $this->dropForeignKey("fk-card_progress-user_id", "{{%card_progress}}");
    $this->dropForeignKey("fk-card_progress-card_id", "{{%card_progress}}");
    $this->dropTable("{{%card_progress}}");
  }
}
