import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAccountsOnBigInt1765147172274 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "accounts" 
            ALTER COLUMN "balance" TYPE bigint USING "balance"::bigint,
            ALTER COLUMN "available" TYPE bigint USING "available"::bigint
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE "accounts" 
            ALTER COLUMN "balance" TYPE integer USING "balance"::integer,
            ALTER COLUMN "available" TYPE integer USING "available"::integer
        `);
  }
}
