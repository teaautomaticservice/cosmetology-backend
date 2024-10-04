import { Column, CreateDateColumn, Entity } from 'typeorm';

import { CommonEntity } from '../common/common.entity';

@Entity()
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
