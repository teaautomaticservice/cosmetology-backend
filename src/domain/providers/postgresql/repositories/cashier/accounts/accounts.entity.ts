import { Column, Entity, Index } from 'typeorm';

import { ACCOUNTS_ENTITY } from '@postgres/constants/entities';

import { AccountStatus } from './accounts.types';
import { CommonEntity } from '../../common/common.entity';

@Entity(ACCOUNTS_ENTITY)
export class AccountsEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  public name: string;

  @Column({
    type: 'int',
    nullable: false,
  })
  @Index('accounts_moneyStorageId_1')
  public moneyStorageId: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  public status: AccountStatus;

  @Column({
    type: 'int',
    nullable: false,
  })
  @Index('accounts_currencyId_1')
  public currencyId: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  public balance: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  public available: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description: string | null;
}
