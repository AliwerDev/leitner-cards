<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%review_history}}`.
 *
 * Append-only log: no created_at/updated_at, reviewed_at is the only timestamp
 * a history row needs.
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
      "user_id" => $this->integer()->notNull(),
      "card_id" => $this->integer()->notNull(),
      "level_before" => $this->integer()->notNull(),
      "level_after" => $this->integer()->notNull(),
      "was_correct" => $this->boolean()->notNull(),
      "reviewed_at" => $this->integer()->notNull(),
    ]);

    // Stats: reviews per day, accuracy over a window.
    $this->createIndex(
      "idx-review_history-user_id-reviewed_at",
      "{{%review_history}}",
      ["user_id", "reviewed_at"]
    );

    // Per-card history timeline.
    $this->createIndex(
      "idx-review_history-card_id",
      "{{%review_history}}",
      "card_id"
    );

    $this->addForeignKey(
      "fk-review_history-card_id",
      "{{%review_history}}",
      "card_id",
      "{{%card}}",
      "id",
      "CASCADE",
      "CASCADE"
    );

    $this->addForeignKey(
      "fk-review_history-user_id",
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
    $this->dropForeignKey("fk-review_history-user_id", "{{%review_history}}");
    $this->dropForeignKey("fk-review_history-card_id", "{{%review_history}}");
    $this->dropTable("{{%review_history}}");
  }
}
