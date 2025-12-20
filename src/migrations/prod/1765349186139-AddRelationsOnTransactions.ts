import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationsOnTransactions1765349186139 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "transaction" DROP CONSTRAINT "CHK_amount_positive"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD CONSTRAINT "FK_a36b2e32240779d70562dd775e2" FOREIGN KEY ("debitId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD CONSTRAINT "FK_3e3369ff4d03a6effe7b85b062c" FOREIGN KEY ("creditId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "transaction" DROP CONSTRAINT "FK_3e3369ff4d03a6effe7b85b062c"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction" DROP CONSTRAINT "FK_a36b2e32240779d70562dd775e2"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD CONSTRAINT "CHK_amount_positive" CHECK ((amount > 0))
        `);
  }

}
