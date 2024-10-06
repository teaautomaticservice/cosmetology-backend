import { Column, CreateDateColumn, Entity } from 'typeorm';

import { LOGS_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';

@Entity(LOGS_ENTITY)
export class LogEntity extends CommonEntity {
  @CreateDateColumn()
  public timestamp: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  public key: string | null;

  @Column({
    type: 'varchar',
  })
  public level: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  public authorizedUserId: string | null;

  @Column({
    type: 'varchar',
  })
  public message: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  public meta: string | null;
}
