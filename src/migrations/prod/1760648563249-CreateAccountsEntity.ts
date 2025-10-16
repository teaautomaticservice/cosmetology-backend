import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsEntity1760648563249 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "accounts" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" integer,
                "updatedBy" integer,
                "name" character varying NOT NULL,
                "moneyStorageId" integer NOT NULL,
                "status" character varying NOT NULL,
                "currencyId" integer NOT NULL,
                "balance" integer NOT NULL,
                "available" integer NOT NULL,
                "description" text,
                CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "accounts_moneyStorageId_1" ON "accounts" ("moneyStorageId")
        `);
    await queryRunner.query(`
            CREATE INDEX "accounts_currencyId_1" ON "accounts" ("currencyId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."accounts_currencyId_1"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."accounts_moneyStorageId_1"
        `);
    await queryRunner.query(`
            DROP TABLE "accounts"
        `);
  }
}
