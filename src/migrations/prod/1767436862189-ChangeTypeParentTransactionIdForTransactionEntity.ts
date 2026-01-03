import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTypeParentTransactionIdForTransactionEntity1767436862189 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_254e53a84f245fe78d7312e49d"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction" DROP COLUMN "parentTransactionId"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD "parentTransactionId" character varying
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_254e53a84f245fe78d7312e49d" ON "transaction" ("parentTransactionId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_254e53a84f245fe78d7312e49d"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction" DROP COLUMN "parentTransactionId"
        `);
    await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD "parentTransactionId" integer
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_254e53a84f245fe78d7312e49d" ON "transaction" ("parentTransactionId")
        `);
  }

}
