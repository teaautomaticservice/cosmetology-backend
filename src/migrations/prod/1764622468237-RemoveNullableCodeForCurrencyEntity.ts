import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNullableCodeForCurrencyEntity1764622468237 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currencies"
            ALTER COLUMN "code"
            SET NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currencies"
            ALTER COLUMN "code" DROP NOT NULL
        `);
  }
}
