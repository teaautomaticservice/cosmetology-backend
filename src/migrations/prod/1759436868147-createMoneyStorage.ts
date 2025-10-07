import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMoneyStorage1759436868147 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "money_storages" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" integer,
                "updatedBy" integer,
                "name" character varying NOT NULL,
                "status" character varying NOT NULL,
                "code" character varying,
                "description" text,
                CONSTRAINT "UQ_cea7172e2cce104d20391b2c602" UNIQUE ("code"),
                CONSTRAINT "PK_7ee115343b49e4184f5ede4827c" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            INSERT INTO "money_storages" (
                "createdAt",
                "updatedAt",
                "name",
                "status",
                "code",
                "description"
            ) values (
                now(),
                now(),
                'Obligation Accounts',
                'created',
                'OBL',
                'Accounts used to track outstanding liabilities and commitments, reflecting the debt burden that needs to be repaid in the future.'
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "money_storages"
        `);
  }

}
