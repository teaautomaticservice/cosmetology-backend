import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionOperationEntity1764622136599 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "transaction_operations" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" integer,
                "updatedBy" integer,
                "name" character varying NOT NULL,
                "description" text,
                CONSTRAINT "UQ_c95a3b41349d8bd2a2a30d2745e" UNIQUE ("name"),
                CONSTRAINT "PK_323c2e5a4d8f8eb378e112c1e9c" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE IF EXISTS "transaction_operations"
        `);
  }

}
