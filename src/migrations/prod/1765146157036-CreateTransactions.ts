import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactions1765146157036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "transaction" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" integer,
                "updatedBy" integer,
                "transactionId" character varying NOT NULL,
                "parentTransactionId" integer,
                "amount" bigint NOT NULL,
                "debitId" integer,
                "creditId" integer,
                "status" character varying NOT NULL,
                "operationType" character varying NOT NULL,
                "executionDate" TIMESTAMP WITH TIME ZONE,
                "expireDate" TIMESTAMP WITH TIME ZONE,
                "description" text,
                CONSTRAINT "UQ_bdcf2c929b61c0935576652d9b0" UNIQUE ("transactionId"),
                CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_amount_positive" CHECK ("amount" > 0)
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_05dff28a7974d6c2205e96c0c9" ON "transaction" ("executionDate")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_396ed284a094b0819db30f281e" ON "transaction" ("operationType")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_63f749fc7f7178ae1ad85d3b95" ON "transaction" ("status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_64b157a7c34e723cafc457568a" ON "transaction" ("creditId", "createdAt")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9a10bc44210477435bcbcc7dfe" ON "transaction" ("debitId", "createdAt")
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
            DROP INDEX "public"."IDX_9a10bc44210477435bcbcc7dfe"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_64b157a7c34e723cafc457568a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_63f749fc7f7178ae1ad85d3b95"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_396ed284a094b0819db30f281e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_05dff28a7974d6c2205e96c0c9"
        `);
    await queryRunner.query(`
            DROP TABLE "transaction"
        `);
  }

}
