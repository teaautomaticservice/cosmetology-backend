import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1728235771816 implements MigrationInterface {
    name = 'Init1728235771816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('blocked', 'deleted', 'deletedByGdpr', 'active', 'banned', 'deactivated')`);
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('operator', 'client', 'administrator', 'superAdministrator')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying NOT NULL, "password" character varying NOT NULL, "displayName" character varying, "status" "public"."users_status_enum" NOT NULL, "type" "public"."users_type_enum" NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f5cbe00928ba4489cc7312573" ON "users" ("updatedAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "email_1" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "password_1" ON "users" ("password") `);
        await queryRunner.query(`CREATE INDEX "displayName_1" ON "users" ("displayName") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sessionId" character varying NOT NULL, "expireAt" TIMESTAMP NOT NULL, "userIdId" integer, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_25a0ad0d4af94552269c66c2c1" ON "sessions" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "sessionId_1" ON "sessions" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "expireAt_1" ON "sessions" ("expireAt") `);
        await queryRunner.query(`CREATE INDEX "userId_1" ON "sessions" ("userIdId") `);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date" TIMESTAMP NOT NULL DEFAULT now(), "message" character varying NOT NULL, "owner" character varying NOT NULL, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_284257a7a4f1c23a4bda08ecf2" ON "messages" ("updatedAt") `);
        await queryRunner.query(`ALTER TABLE "logs" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "timestamp" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "level" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "message" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "meta"`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "meta" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_953b93af84b32b74e611a52871" ON "logs" ("updatedAt") `);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_0b3f28240547daacf77f30080e9" FOREIGN KEY ("userIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_0b3f28240547daacf77f30080e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_953b93af84b32b74e611a52871"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "meta"`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "meta" json`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "message" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "level" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "timestamp" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "logs" ALTER COLUMN "timestamp" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_284257a7a4f1c23a4bda08ecf2"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."userId_1"`);
        await queryRunner.query(`DROP INDEX "public"."expireAt_1"`);
        await queryRunner.query(`DROP INDEX "public"."sessionId_1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25a0ad0d4af94552269c66c2c1"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."displayName_1"`);
        await queryRunner.query(`DROP INDEX "public"."password_1"`);
        await queryRunner.query(`DROP INDEX "public"."email_1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f5cbe00928ba4489cc7312573"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    }

}
