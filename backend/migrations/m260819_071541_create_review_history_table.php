<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%review_history}}`.
 */
class m260819_071541_create_review_history_table extends Migration
{
  /**
   * {@inheritdoc}
   */
  public function safeUp()
  {
    $this->createTable("{{%review_history}}", [
      "id" => $this->primaryKey(),
      "card_id" => $this->integer()->notNull(),
      "user_id" => $this->integer()->notNull(),
      "box_before" => $this->integer()->notNull(),
      "box_after" => $this->integer()->notNull(),
      "was_correct" => $this->boolean()->notNull(),
      "reviewed_at" => $this->date()->notNull(),
    ]);

    $this->createIndex(
      "idx-review_history-user_id-reviewed_at",
      "{{%review_history}}",
      ["user_id", "reviewed_at"]
    );

    $this->addForeignKey(
      "idx-review_history-card_id",
      "{{%review_history}}",
      "card_id",
      "{{%card}}",
      "id",
      "CASCADE",
      "CASCADE"
    );

    $this->addForeignKey(
      "idx-review_history-user_id",
      "{{%review_history}}",
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
    $this->dropTable("{{%review_history}}");
  }
}
