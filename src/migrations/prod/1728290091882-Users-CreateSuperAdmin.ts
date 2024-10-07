import { MigrationInterface, QueryRunner } from 'typeorm';

import { USERS_ENTITY } from '@domain/providers/postgresql/constants/entities';
import { UserType } from '@domain/types/users.types';

import { generateUser } from '../utils/generateUser';

const SUPER_ADMIN_EMAIL = 'dahakalab@gmail.com';

export class UsersCreateSuper1728290091882 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const superAdmin = await generateUser({
      email: SUPER_ADMIN_EMAIL,
      type: UserType.SuperAdministrator,
    });

    await queryRunner.manager.createQueryBuilder()
      .insert()
      .into(USERS_ENTITY)
      .values(superAdmin)
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "${USERS_ENTITY}" WHERE email = '${SUPER_ADMIN_EMAIL}'`);
  }
}
