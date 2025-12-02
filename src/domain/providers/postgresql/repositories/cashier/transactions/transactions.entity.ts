import { Column, CreateDateColumn, Entity } from 'typeorm';

import { TRANSACTION } from '@providers/postgresql/constants/entities';

import { OperationType, TransactionStatus } from './transactions.types';
import { CommonEntity } from '../../common/common.entity';

@Entity(TRANSACTION)
export class CurrencyEntity extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
  })
  public value: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  public debitId: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  public creditId: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  public status: TransactionStatus;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  public operationType: OperationType;

  @CreateDateColumn({ type: 'timestamptz' })
  public executionDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  public expireDate: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description: string | null;
}
