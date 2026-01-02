import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoneyStorageType1767308034415 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "money_storages"
            ADD "type" character varying NOT NULL DEFAULT 'common'
        `);

    await queryRunner.query(`
            UPDATE "money_storages"
            SET "type" = 'obligation'
            WHERE "code" = 'OBL'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "money_storages" DROP COLUMN "type"
        `);
  }

}
