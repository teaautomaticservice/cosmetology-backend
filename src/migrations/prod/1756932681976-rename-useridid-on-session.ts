import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserididOnSession1756932681976 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions" RENAME COLUMN "userIdId" TO "userId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions" RENAME COLUMN "userId" TO "userIdId"
    `);
  }
}
