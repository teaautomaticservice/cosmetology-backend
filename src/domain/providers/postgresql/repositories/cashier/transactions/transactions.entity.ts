import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm';

import { ID } from '@providers/common/common.type';
import { TRANSACTION } from '@providers/postgresql/constants/entities';

import { OperationType, TransactionStatus } from './transactions.types';
import { CommonEntity } from '../../common/common.entity';
import { AccountEntity } from '../accounts/accounts.entity';

@Entity(TRANSACTION)
@Index(['parentTransactionId'])
@Index(['debitId', 'createdAt'])
@Index(['creditId', 'createdAt'])
@Index(['status'])
@Index(['operationType'])
@Index(['executionDate'])
export class TransactionEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  public transactionId: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  public parentTransactionId: ID | null;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  public amount: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  public debitId: ID | null;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'debitId' })
  public debitAccount: AccountEntity | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  public creditId: ID | null;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'creditId' })
  public creditAccount: AccountEntity | null;

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

  @Column({ type: 'timestamptz', nullable: true })
  public executionDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  public expireDate: Date | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description: string | null;
}
