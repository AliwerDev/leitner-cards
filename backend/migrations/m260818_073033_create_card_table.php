
<?php

use yii\db\Migration;

class m260818_073033_create_card_table extends Migration
{
  /**
   * {@inheritdoc}
   */
  public function safeUp()
  {
    $this->createTable("{{%card}}", [
      "id" => $this->primaryKey(),
      "deck_id" => $this->integer()->notNull(),
      "front" => $this->text()->notNull(),
      "back" => $this->text()->notNull(),
      "created_at" => $this->integer()->notNull(),
      "updated_at" => $this->integer()->notNull(),
    ]);

    $this->createIndex("idx-card-deck_id", "{{%card}}", "deck_id");

    $this->addForeignKey(
      "fk-card_deck_id",
      "{{%card}}",
      "deck_id",
      "{{%deck}}",
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
    $this->dropTable("{{%card}}");
  }
}

