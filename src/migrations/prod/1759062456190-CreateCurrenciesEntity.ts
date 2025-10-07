import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurrenciesEntity1759062456190 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "currencies" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" integer,
                "updatedBy" integer,
                "name" character varying NOT NULL,
                "status" character varying NOT NULL,
                "code" character varying,
                CONSTRAINT "UQ_9f8d0972aeeb5a2277e40332d29" UNIQUE ("code"),
                CONSTRAINT "PK_d528c54860c4182db13548e08c4" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "currencies"
        `);
  }

}
