<?php

use yii\db\Migration;

/**
 * Adds the idempotency token that makes an offline answer safe to resend.
 *
 * The mobile outbox holds answers the server has not accepted yet and retries
 * them when a connection returns. Without a token the server cannot tell a
 * retry from a new answer, so a reply lost on the way back appends a second
 * review_history row and applies the level transition twice. This column is
 * what lets the server recognise the second delivery as the first one.
 */
class m260825_090000_add_client_id_to_review_history extends Migration
{
  /**
   * {@inheritdoc}
   */
  public function safeUp()
  {
    $this->addColumn(
      "{{%review_history}}",
      "client_id",
      $this->string(64)->null()
    );

    /*
     * UNIQUE (user_id, client_id) rather than a global unique.
     *
     * The token is generated on a device with no coordination, so two users
     * can collide by chance. Scoping to the user makes a collision impossible
     * to weaponise, and the index is exactly the one the dedupe lookup uses.
     *
     * Postgres treats NULLs as distinct in a unique index, so every existing
     * row and every web request - which sends no client_id - passes through
     * without a backfill.
     */
    $this->createIndex(
      "idx-review_history-user_id-client_id",
      "{{%review_history}}",
      ["user_id", "client_id"],
      true
    );
  }

  /**
   * {@inheritdoc}
   */
  public function safeDown()
  {
    $this->dropIndex(
      "idx-review_history-user_id-client_id",
      "{{%review_history}}"
    );
    $this->dropColumn("{{%review_history}}", "client_id");
  }
}
