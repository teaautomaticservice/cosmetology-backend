import { Column, Entity } from 'typeorm';

import { TRANSACTION_OPERATIONS } from '@postgresql/constants/entities';

import { CommonEntity } from '../../common/common.entity';

@Entity(TRANSACTION_OPERATIONS)
export class TransactionOperationEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  public name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description: string | null;
}
