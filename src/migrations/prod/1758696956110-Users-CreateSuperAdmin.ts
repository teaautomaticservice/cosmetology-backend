import { MigrationInterface, QueryRunner } from 'typeorm';

import { USERS_ENTITY } from '@providers/postgresql/constants/entities';
import { UserType } from '@typings/users.types';

import { generateUser } from '../utils/generateUser';

const SUPER_ADMIN_EMAIL = 'dahakalab@gmail.com';

export class UsersCreateSuper1728290091882 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const superAdmin = await generateUser({
      email: SUPER_ADMIN_EMAIL,
      type: UserType.SuperAdministrator,
    });

    await queryRunner.query(
      `INSERT INTO "${USERS_ENTITY}" ("createdAt", "updatedAt", "email", "password", "status", "type")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        superAdmin.createdAt,
        superAdmin.updatedAt,
        superAdmin.email,
        superAdmin.password,
        superAdmin.status,
        superAdmin.type,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "${USERS_ENTITY}" WHERE email = '${SUPER_ADMIN_EMAIL}'`);
  }
}
