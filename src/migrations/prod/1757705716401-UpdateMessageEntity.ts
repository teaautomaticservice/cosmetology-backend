import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMessageEntity1757705716401 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
			ALTER TABLE "sessions" DROP CONSTRAINT "FK_0b3f28240547daacf77f30080e9"
		`);
    await queryRunner.query(`
			ALTER TABLE "sessions"
			ALTER COLUMN "userId"
			SET NOT NULL
		`);

    await queryRunner.query(`
			ALTER TABLE "messages"
			ADD "createdByUserId" integer
		`);
    await queryRunner.query(`
			ALTER TABLE "messages"
			ADD "updatedByUserId" integer
		`);

    await queryRunner.query(`
			UPDATE "messages"
			SET "createdByUserId" = 1
			WHERE "createdByUserId" IS NULL
		`);
    await queryRunner.query(`
			UPDATE "messages"
			SET "updatedByUserId" = 1
			WHERE "updatedByUserId" IS NULL
		`);

    await queryRunner.query(`
			ALTER TABLE "messages"
			ALTER COLUMN "createdByUserId" SET NOT NULL
		`);
    await queryRunner.query(`
			ALTER TABLE "messages"
			ALTER COLUMN "updatedByUserId" SET NOT NULL
		`);

    await queryRunner.query(`
			ALTER TABLE "messages" DROP COLUMN "owner"
		`);

    await queryRunner.query(`
			CREATE INDEX "messageCreatedByUserId_1" ON "messages" ("createdByUserId")
		`);
    await queryRunner.query(`
			CREATE INDEX "messageUpdatedByUserId_1" ON "messages" ("updatedByUserId")
		`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
			ALTER TABLE "sessions"
			ALTER COLUMN "userId" DROP NOT NULL
		`);
    await queryRunner.query(`
			ALTER TABLE "sessions"
			ADD CONSTRAINT "FK_0b3f28240547daacf77f30080e9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
		`);

    await queryRunner.query(`
			DROP INDEX "public"."messageUpdatedByUserId_1"
		`);
    await queryRunner.query(`
			DROP INDEX "public"."messageCreatedByUserId_1"
		`);
    await queryRunner.query(`
			ALTER TABLE "messages" DROP COLUMN "updatedByUserId"
		`);
    await queryRunner.query(`
			ALTER TABLE "messages" DROP COLUMN "createdByUserId"
		`);

    await queryRunner.query(`
			ALTER TABLE "messages"
			ADD "owner" character varying
		`);
    await queryRunner.query(`
			UPDATE "messages"
			SET "owner" = 'Owner'
			WHERE "owner" IS NULL
		`);
    await queryRunner.query(`
			ALTER TABLE "messages"
			ALTER COLUMN "owner" SET NOT NULL
		`);
  }

}
