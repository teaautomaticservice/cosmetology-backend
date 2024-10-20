import { MigrationInterface, QueryRunner, Table } from 'typeorm';

import { MESSAGES_ENTITY } from '@domain/providers/postgresql/constants/entities';

const OLD_MESSAGE_ENTITY = 'message_entity';

export class DropOldTable1729080439689 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.manager.createQueryBuilder(OLD_MESSAGE_ENTITY, 'entity')
      .select('entity')
      .getMany();

    await queryRunner.manager.createQueryBuilder()
      .insert()
      .into(MESSAGES_ENTITY)
      .values(result.map(({ date, message, owner }) => ({
        createdAt: date, updatedAt: date, date, message, owner
      })))
      .execute();

    await queryRunner.dropTable(OLD_MESSAGE_ENTITY);
    await queryRunner.dropTable('log_entity');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: OLD_MESSAGE_ENTITY,
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
        },
        {
          name: 'date',
          type: 'timestamptz',
          default: 'now()',
        },
        {
          name: 'message',
          type: 'varchar',
        },
        {
          name: 'owner',
          type: 'varchar',
        },
      ],
    }), true);

    const result = await queryRunner.manager.createQueryBuilder(MESSAGES_ENTITY, 'entity')
      .select('entity')
      .getMany();

    await queryRunner.manager.createQueryBuilder()
      .insert()
      .into(OLD_MESSAGE_ENTITY)
      .values(result.map(({ createdAt, updatedAt, date, message, owner }) => ({
        createdAt, updatedAt, date, message, owner
      })))
      .execute();
  }
}
