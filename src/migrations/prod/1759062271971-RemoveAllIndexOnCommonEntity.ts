import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAllIndexOnCommonEntity1759062271971 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0f5cbe00928ba4489cc7312573"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d1c708d852dcfde10fa0fd12fa"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3f685b7ecabe1703331227aa4d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_953b93af84b32b74e611a52871"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_44d9d7225cbe6e248376dd413d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f4cb29076f8a55a70c9545b6ee"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_284257a7a4f1c23a4bda08ecf2"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_99d184ff35c63f34ed196cc14d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8c81e184ebeb3bc9c608f20657"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_25a0ad0d4af94552269c66c2c1"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_28e79e52851ae6894f90f2cfc8"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_97671909ccbc3812cae43f5d53"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "IDX_97671909ccbc3812cae43f5d53" ON "sessions" ("updatedBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_28e79e52851ae6894f90f2cfc8" ON "sessions" ("createdBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_25a0ad0d4af94552269c66c2c1" ON "sessions" ("updatedAt")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8c81e184ebeb3bc9c608f20657" ON "messages" ("updatedBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_99d184ff35c63f34ed196cc14d" ON "messages" ("createdBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_284257a7a4f1c23a4bda08ecf2" ON "messages" ("updatedAt")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f4cb29076f8a55a70c9545b6ee" ON "logs" ("updatedBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_44d9d7225cbe6e248376dd413d" ON "logs" ("createdBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_953b93af84b32b74e611a52871" ON "logs" ("updatedAt")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3f685b7ecabe1703331227aa4d" ON "users" ("updatedBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d1c708d852dcfde10fa0fd12fa" ON "users" ("createdBy")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0f5cbe00928ba4489cc7312573" ON "users" ("updatedAt")
        `);
  }

}
