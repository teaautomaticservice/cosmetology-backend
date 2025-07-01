import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingStatus1751394025214 implements MigrationInterface {
  public name = 'AddPendingStatus1751394025214';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "users_status_enum" ADD VALUE 'pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "users" SET "status" = 'active' WHERE "status" = 'pending'`);
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum_old" AS ENUM('blocked', 'deleted', 'deletedByGdpr', 'active', 'banned', 'deactivated')`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum_old" USING "status"::"text"::"public"."users_status_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."users_status_enum_old" RENAME TO "users_status_enum"`);
  }
}
