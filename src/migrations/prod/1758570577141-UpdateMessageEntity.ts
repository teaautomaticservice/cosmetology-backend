import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMessageEntity1758570577141 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD "createdBy" integer DEFAULT 1
        `);
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD "updatedBy" integer DEFAULT 1
        `);

    await queryRunner.query(`
            UPDATE "messages"
            SET "createdBy" = "createdByUserId"
        `);
    await queryRunner.query(`
            UPDATE "messages"
            SET "updatedBy" = "updatedByUserId"
        `);

    await queryRunner.query(`
            DROP INDEX "public"."messageCreatedByUserId_1"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."messageUpdatedByUserId_1"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP COLUMN "createdByUserId"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP COLUMN "updatedByUserId"
        `);

    await queryRunner.query(`
            CREATE INDEX "messageCreatedByUserId_1" ON "messages" ("createdBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "messageUpdatedByUserId_1" ON "messages" ("updatedBy")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD "updatedByUserId" integer NOT NULL DEFAULT 1
        `);
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD "createdByUserId" integer NOT NULL DEFAULT 1
        `);

    await queryRunner.query(`
            UPDATE "messages"
            SET "createdByUserId" = "createdBy"
        `);
    await queryRunner.query(`
            UPDATE "messages"
            SET "updatedByUserId" = "updatedBy"
        `);

    await queryRunner.query(`
            DROP INDEX "public"."messageUpdatedByUserId_1"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."messageCreatedByUserId_1"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP COLUMN "updatedBy"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP COLUMN "createdBy"
        `);

    await queryRunner.query(`
            CREATE INDEX "messageUpdatedByUserId_1" ON "messages" ("updatedByUserId")
        `);
    await queryRunner.query(`
            CREATE INDEX "messageCreatedByUserId_1" ON "messages" ("createdByUserId")
        `);
  }

}
